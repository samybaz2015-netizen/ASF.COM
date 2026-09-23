<#
.SYNOPSIS
    نسخ بنية قاعدتي البيانات من الإنتاج إلى SQL Server المحلي - بلا بيانات.

.DESCRIPTION
    يقرأ سلاسل الاتصال من appsettings.json الخاص بالنسخة المنشورة، ويستخرج البنية
    فقط (ExtractAllTableData=False) إلى ملفي dacpac، ثم ينشرها على قاعدتين محليتين.

    الإنتاج يُقرأ فقط ولا يُكتب فيه إطلاقاً.
    سلاسل الاتصال لا تُطبع في أي مخرجات.
#>
[CmdletBinding()]
param(
    [string]$AppSettings = 'E:\Asf\local\api\appsettings.json',
    [string]$OutDir      = 'E:\Asf\local\schema',
    [string]$LocalServer = '.\SQLEXPRESS'
)

$ErrorActionPreference = 'Stop'
$env:PATH += ";$env:USERPROFILE\.dotnet\tools"

function Get-ProductionConnectionStrings {
    param([string]$Path)

    # الملف بصيغة JSONC (تعليقات // داخله) ولا يقبله ConvertFrom-Json.
    # نستخرج بتعبير نمطي بعد إسقاط الأسطر المعلّقة - ولا نحلّل الملف كاملاً، حتى لا
    # يظهر أي سر في رسالة خطأ إن تغيّرت صيغة الملف.
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8 | Where-Object { $_.TrimStart() -notmatch '^//' }

    $result = [ordered]@{}
    foreach ($key in @('DefaultConnection', 'IdentityConnection')) {
        $value = $null
        foreach ($line in $lines) {
            $match = [regex]::Match($line, '"' + $key + '"\s*:\s*"([^"]+)"')
            if ($match.Success) { $value = $match.Groups[1].Value }
        }
        if (-not $value) { throw "لم أجد سلسلة الاتصال $key في الملف المحدد." }
        $result[$key] = $value
    }
    return $result
}

function Get-DatabaseName {
    param([string]$ConnectionString)
    foreach ($segment in $ConnectionString.Split(';')) {
        $pair = $segment.Split('=', 2)
        if ($pair.Count -eq 2 -and $pair[0].Trim() -in @('Initial Catalog', 'Database')) {
            return $pair[1].Trim()
        }
    }
    return '(غير معروف)'
}

if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

$production = Get-ProductionConnectionStrings -Path $AppSettings

$targets = @(
    @{ Key = 'DefaultConnection';  LocalDb = 'AsfDefault_Local';  File = 'default.dacpac'  }
    @{ Key = 'IdentityConnection'; LocalDb = 'AsfIdentity_Local'; File = 'identity.dacpac' }
)

foreach ($target in $targets) {
    $source   = $production[$target.Key]
    $remoteDb = Get-DatabaseName $source
    $dacpac   = Join-Path $OutDir $target.File

    Write-Host ''
    Write-Host ("=== {0} ===" -f $target.Key) -ForegroundColor White
    Write-Host ("مصدر  : {0} (الإنتاج - قراءة فقط)" -f $remoteDb) -ForegroundColor DarkGray
    Write-Host ("وجهة  : {0} على {1}" -f $target.LocalDb, $LocalServer) -ForegroundColor DarkGray

    Write-Host 'استخراج البنية...' -ForegroundColor Yellow
    & sqlpackage /Action:Extract `
        /SourceConnectionString:$source `
        /TargetFile:$dacpac `
        /p:ExtractAllTableData=False `
        /p:IgnoreUserLoginMappings=True `
        /p:IgnorePermissions=True `
        /q:True
    if ($LASTEXITCODE -ne 0) { throw "فشل الاستخراج من $remoteDb" }

    $sizeKb = [math]::Round((Get-Item $dacpac).Length / 1KB, 1)
    Write-Host ("تم الاستخراج: {0} ({1} كيلوبايت)" -f $target.File, $sizeKb) -ForegroundColor Green

    $localCs = "Data Source=$LocalServer;Initial Catalog=$($target.LocalDb);Integrated Security=True;Encrypt=False;TrustServerCertificate=True;"

    Write-Host 'النشر محلياً...' -ForegroundColor Yellow
    & sqlpackage /Action:Publish `
        /SourceFile:$dacpac `
        /TargetConnectionString:$localCs `
        /p:CreateNewDatabase=True `
        /p:BlockOnPossibleDataLoss=False `
        /q:True
    if ($LASTEXITCODE -ne 0) { throw "فشل النشر على $($target.LocalDb)" }

    Write-Host ("تم إنشاء {0}" -f $target.LocalDb) -ForegroundColor Green
}

Write-Host ''
Write-Host '=== الجداول المحلية ===' -ForegroundColor White
foreach ($db in @('AsfDefault_Local', 'AsfIdentity_Local')) {
    $count = & sqlcmd -S $LocalServer -E -C -d $db -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables"
    Write-Host ("{0,-20} {1} جدولاً" -f $db, ($count | Select-Object -First 1).Trim())
}
