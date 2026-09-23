<#
.SYNOPSIS
    Download the Asf websites from SmarterASP.NET hosting over FTP.

.DESCRIPTION
    Downloads the 'api' and 'frontend' sites into backup\live-<date>\.
    The Ataa site on the same account is skipped and refused by a guard.

    Credentials: read from tools\ftp.env if present, otherwise you are prompted.
    The password is typed hidden and is never written to disk.

.EXAMPLE
    # preview the remote tree, download nothing
    powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1 -ListOnly

.EXAMPLE
    # download both sites
    powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1

.EXAMPLE
    # download one site only, to a chosen folder
    powershell -ExecutionPolicy Bypass -File tools\ftp_pull.ps1 -RemoteDir /www/api -Destination E:\Asf\backup\api
#>
[CmdletBinding()]
param(
    [string]$Destination,
    [string]$RemoteDir,
    # Folder names as they appear under www. 'db' is not included by default -
    # pass it explicitly if you want the database folder too.
    [string[]]$Sites = @('api', 'Frontend'),
    [string]$EnvFile,
    [switch]$UseSsl,
    [switch]$ListOnly
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$toolsDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $toolsDir
if (-not $EnvFile)     { $EnvFile     = Join-Path $toolsDir 'ftp.env' }
if (-not $Destination) { $Destination = Join-Path $projectDir ('backup\live-' + (Get-Date -Format 'yyyy-MM-dd')) }

# Never descend into these.
#   ataa / site3 = the Ataa website on the same SmarterASP account. Out of scope here.
#   logs / log / _vti_cnf = noise in a deployed site.
$skipDirs = @('ataa', 'site3', 'logs', 'log', '_vti_cnf')

function Test-IsAtaaPath {
    param([string]$Path)
    return ($Path -match '(^|/)(ataa|site3)(/|$)')
}

function Get-FtpConfig {
    param([string]$Path)

    $cfg = @{}
    if (Test-Path -LiteralPath $Path) {
        foreach ($line in (Get-Content -LiteralPath $Path -Encoding UTF8)) {
            $trimmed = $line.Trim()
            if (-not $trimmed -or $trimmed.StartsWith('#') -or ($trimmed -notmatch '=')) { continue }
            $idx = $trimmed.IndexOf('=')
            $key = $trimmed.Substring(0, $idx).Trim()
            $val = $trimmed.Substring($idx + 1).Trim().Trim('"').Trim("'")
            if ($key -and $val) { $cfg[$key] = $val }
        }
        Write-Host ("Loaded settings from {0}" -f $Path) -ForegroundColor DarkGray
    }

    if (-not $cfg['FTP_HOST']) {
        Write-Host ''
        Write-Host 'SmarterASP control panel -> FTP tab shows these values.' -ForegroundColor Yellow
        $cfg['FTP_HOST'] = (Read-Host 'FTP host (e.g. ftp.smarterasp.net or 1xx.xx.xx.xx)').Trim()
    }
    if (-not $cfg['FTP_USER']) {
        $cfg['FTP_USER'] = (Read-Host 'FTP username').Trim()
    }
    if (-not $cfg['FTP_PASS']) {
        $secure = Read-Host 'FTP password (hidden)' -AsSecureString
        $bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try     { $cfg['FTP_PASS'] = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    }

    foreach ($required in @('FTP_HOST', 'FTP_USER', 'FTP_PASS')) {
        if (-not $cfg[$required]) { throw "$required is required." }
    }
    return $cfg
}

function Get-FtpUri {
    param([string]$HostName, [int]$Port, [string]$RemotePath)
    $segments = @()
    foreach ($part in $RemotePath.Split('/')) {
        if ($part) { $segments += [Uri]::EscapeDataString($part) }
    }
    return ('ftp://{0}:{1}/{2}' -f $HostName, $Port, ($segments -join '/'))
}

function New-FtpRequest {
    param([string]$Uri, [string]$Method)
    $request = [System.Net.FtpWebRequest]::Create($Uri)
    $request.Method      = $Method
    $request.Credentials = $script:credential
    $request.UsePassive  = $script:passive
    $request.UseBinary   = $true
    $request.KeepAlive   = $false
    $request.Timeout     = 120000
    $request.EnableSsl   = $script:useSsl
    return $request
}

function Get-FtpListing {
    # Returns objects with Name / IsDir / Size, handling IIS (DOS) and Unix listing formats.
    param([string]$RemotePath)

    $uri      = Get-FtpUri -HostName $script:ftpHost -Port $script:ftpPort -RemotePath $RemotePath
    $request  = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails)
    $response = $request.GetResponse()
    $reader   = New-Object System.IO.StreamReader($response.GetResponseStream(), [System.Text.Encoding]::UTF8)
    try     { $raw = $reader.ReadToEnd() }
    finally { $reader.Dispose(); $response.Close() }

    $items = @()
    foreach ($line in ($raw -split "`r?`n")) {
        if (-not $line.Trim()) { continue }

        if ($line -match '^\s*\d{2}-\d{2}-\d{2,4}\s+\d{1,2}:\d{2}(AM|PM)\s+(<DIR>|\d+)\s+(.+)$') {
            # IIS / Windows:  09-19-26  01:02PM       <DIR>          bin
            $sizeToken = $Matches[2]
            $name      = $Matches[3].Trim()
            $isDir     = ($sizeToken -eq '<DIR>')
            if ($isDir) { $size = [int64]0 } else { $size = [int64]$sizeToken }
        }
        elseif ($line -match '^([dl-])[rwxsStT-]{9}[.+]?\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\S+\s+\S+\s+(.+)$') {
            # Unix:  -rw-r--r--   1 owner group  1234 Sep 19 13:02 web.config
            $isDir = ($Matches[1] -eq 'd')
            $size  = [int64]$Matches[2]
            $name  = $Matches[3].Trim()
        }
        else {
            Write-Warning ("Unrecognized listing line, skipped: {0}" -f $line)
            continue
        }

        if ($name -eq '.' -or $name -eq '..') { continue }
        $items += [pscustomobject]@{ Name = $name; IsDir = $isDir; Size = $size }
    }
    return $items
}

function Save-FtpFile {
    param([string]$RemotePath, [string]$LocalPath)

    $uri      = Get-FtpUri -HostName $script:ftpHost -Port $script:ftpPort -RemotePath $RemotePath
    $request  = New-FtpRequest -Uri $uri -Method ([System.Net.WebRequestMethods+Ftp]::DownloadFile)
    $response = $request.GetResponse()
    $source   = $response.GetResponseStream()
    $target   = [System.IO.File]::Create($LocalPath)
    try     { $source.CopyTo($target, 65536) }
    finally { $target.Dispose(); $source.Dispose(); $response.Close() }
}

function Copy-FtpTree {
    param([string]$RemotePath, [string]$LocalPath, [int]$Depth = 0)

    $indent = '  ' * $Depth
    try {
        $entries = Get-FtpListing -RemotePath $RemotePath
    }
    catch {
        Write-Host ("{0}[!] cannot list {1} : {2}" -f $indent, $RemotePath, $_.Exception.Message) -ForegroundColor Red
        $script:stats.Errors++
        return
    }

    if (-not $ListOnly -and -not (Test-Path -LiteralPath $LocalPath)) {
        New-Item -ItemType Directory -Path $LocalPath -Force | Out-Null
    }

    foreach ($entry in $entries) {
        $remoteChild = ($RemotePath.TrimEnd('/') + '/' + $entry.Name)
        $localChild  = Join-Path $LocalPath $entry.Name

        if ($entry.IsDir) {
            if ($skipDirs -contains $entry.Name.ToLower()) {
                Write-Host ("{0}[skip] {1}/" -f $indent, $entry.Name) -ForegroundColor DarkGray
                continue
            }
            Write-Host ("{0}[dir ] {1}/" -f $indent, $entry.Name) -ForegroundColor Cyan
            $script:stats.Dirs++
            Copy-FtpTree -RemotePath $remoteChild -LocalPath $localChild -Depth ($Depth + 1)
        }
        elseif ($ListOnly) {
            Write-Host ("{0}[file] {1}  ({2:N0} bytes)" -f $indent, $entry.Name, $entry.Size)
            $script:stats.Files++
            $script:stats.Bytes += $entry.Size
        }
        else {
            try {
                Save-FtpFile -RemotePath $remoteChild -LocalPath $localChild
                Write-Host ("{0}[file] {1}  ({2:N0} bytes)" -f $indent, $entry.Name, $entry.Size)
                $script:stats.Files++
                $script:stats.Bytes += $entry.Size
            }
            catch {
                Write-Host ("{0}[!] failed {1} : {2}" -f $indent, $remoteChild, $_.Exception.Message) -ForegroundColor Red
                $script:stats.Errors++
            }
        }
    }
}

function Resolve-WebRoot {
    <# The FTP account may land on the account home, on www, or inside a single site. #>
    $names = @()
    foreach ($entry in (Get-FtpListing -RemotePath '/')) {
        if ($entry.IsDir) { $names += $entry.Name.ToLower() }
    }

    Write-Host ("Root contains: {0}" -f ($names -join ', ')) -ForegroundColor DarkGray

    if ($names -contains 'wwwroot') { return '' }          # already inside one published site
    if ($names -contains 'www')     { return '/www' }
    if ($names -contains 'api' -or $names -contains 'frontend') { return '/' }
    if ($names -contains 'home')    { return '/home/asfconsult-002/www' }
    return '/'
}

# ------------------------------------------------------------------ main --
$cfg = Get-FtpConfig -Path $EnvFile

$script:ftpHost = $cfg['FTP_HOST'] -replace '^ftp://', '' -replace '/+$', ''
if ($cfg['FTP_PORT']) { $script:ftpPort = [int]$cfg['FTP_PORT'] } else { $script:ftpPort = 21 }
$script:passive = -not (@('0', 'false', 'no') -contains ("" + $cfg['FTP_PASSIVE']).ToLower())

# Fail early with a readable message instead of a raw WebException deep in the run.
try { $null = [System.Net.Dns]::GetHostAddresses($script:ftpHost) }
catch {
    throw ("Cannot resolve FTP host '{0}'. Use the server address from the control panel's FTP tab - for this account that is asf-consulting.com (208.98.35.193), not 'smarterasp'." -f $script:ftpHost)
}
$script:useSsl = [bool]$UseSsl -or (@('1', 'true', 'yes') -contains ("" + $cfg['FTP_SSL']).ToLower())
$script:credential = New-Object System.Net.NetworkCredential($cfg['FTP_USER'], $cfg['FTP_PASS'])
$script:stats = [pscustomobject]@{ Files = 0; Dirs = 0; Bytes = [int64]0; Errors = 0 }

if ($ListOnly) { $modeText = 'LIST ONLY (nothing is written)' } else { $modeText = "DOWNLOAD -> $Destination" }
Write-Host ''
Write-Host ("Host   : {0}:{1}" -f $script:ftpHost, $script:ftpPort)
Write-Host ("User   : {0}" -f $cfg['FTP_USER'])
Write-Host ("Mode   : {0}" -f $modeText)
Write-Host ''

# Pre-flight: one listing of the root, so a bad login fails with a readable message.
try {
    $null = Get-FtpListing -RemotePath '/'
}
catch {
    $message = $_.Exception.Message

    # Some IIS FTP sites require explicit TLS and answer plain logins with 530.
    if ($message -match '530' -and -not $script:useSsl) {
        Write-Host 'Plain FTP was rejected; retrying over explicit TLS (FTPS)...' -ForegroundColor Yellow
        $script:useSsl = $true
        try {
            $null = Get-FtpListing -RemotePath '/'
            Write-Host 'FTPS works - continuing over TLS. Add FTP_SSL=1 to tools\ftp.env to skip this retry.' -ForegroundColor Green
            $message = ''
        }
        catch {
            $script:useSsl = $false
            $message = $_.Exception.Message
        }
    }

    if ($message -match '530') {
        Write-Host ''
        Write-Host 'The server rejected these credentials (530 Not logged in).' -ForegroundColor Red
        Write-Host 'On SmarterASP the FTP account is separate from the control panel login:' -ForegroundColor Yellow
        Write-Host '  1. Control panel -> FTP tab -> read the exact FTP username listed there.' -ForegroundColor Yellow
        Write-Host '  2. Set or reset the FTP password on that same page.' -ForegroundColor Yellow
        Write-Host '  3. Some accounts need FTP enabled, or a per-site FTP user created first.' -ForegroundColor Yellow
        Write-Host '  4. Put the exact values in tools\ftp.env (FTP_USER / FTP_PASS).' -ForegroundColor Yellow
        Write-Host ''
        throw 'FTP login failed - fix the credentials and run again.'
    }
    if ($message) { throw }
}

$started = Get-Date

if ($RemoteDir) {
    if (Test-IsAtaaPath $RemoteDir) {
        throw "Refusing to touch $RemoteDir - that is the Ataa website. This project only handles api and frontend."
    }
    Write-Host ("=== {0} ===" -f $RemoteDir) -ForegroundColor White
    Copy-FtpTree -RemotePath $RemoteDir -LocalPath $Destination
}
else {
    $base = Resolve-WebRoot

    if ($base -eq '') {
        # The FTP login is scoped to a single published site.
        Write-Host 'FTP account is scoped to one site; downloading it whole.' -ForegroundColor Yellow
        Copy-FtpTree -RemotePath '/' -LocalPath $Destination
    }
    else {
        Write-Host ("Web root: {0}" -f $base) -ForegroundColor DarkGray
        Write-Host ''
        foreach ($site in $Sites) {
            $remote = ($base.TrimEnd('/') + '/' + $site)
            if (Test-IsAtaaPath $remote) {
                Write-Host ("=== {0} SKIPPED (Ataa, out of scope) ===" -f $remote) -ForegroundColor DarkGray
                continue
            }
            Write-Host ("=== {0} ===" -f $remote) -ForegroundColor White
            Copy-FtpTree -RemotePath $remote -LocalPath (Join-Path $Destination $site)
            Write-Host ''
        }
    }
}

$elapsed = (Get-Date) - $started
Write-Host ''
Write-Host ("Done. {0} files, {1} folders, {2:N1} MB, {3} error(s), {4:N0}s." -f $script:stats.Files, $script:stats.Dirs, ($script:stats.Bytes / 1MB), $script:stats.Errors, $elapsed.TotalSeconds) -ForegroundColor Green
if (-not $ListOnly) { Write-Host ("Saved to: {0}" -f $Destination) -ForegroundColor Green }
if ($script:stats.Errors -gt 0) { exit 1 }
