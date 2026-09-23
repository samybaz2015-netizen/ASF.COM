<#
.SYNOPSIS
    نسخ قاعدتي البيانات من الإنتاج إلى SQL Server المحلي - بالبنية والبيانات.

.DESCRIPTION
    يصدّر كل قاعدة إلى ملف bacpac (بنية + بيانات) ثم يستوردها محلياً.
    الإنتاج يُقرأ فقط ولا يُكتب فيه إطلاقاً.
    سلاسل الاتصال لا تُطبع في أي مخرجات.

    تحذير: الناتج بيانات إنتاج حقيقية على هذا الجهاز.
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
        if ($pair.Count -eq 2 -and $pair[0].Trim() -in @('Initial Catalog', 'Database')) { return $pair[1].Trim() }
    }
    return '(غير معروف)'
}

if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

$production = Get-ProductionConnectionStrings -Path $AppSettings

$targets = @(
    @{ Key = 'DefaultConnection';  LocalDb = 'AsfDefault_Local';  File = 'default.bacpac'  }
    @{ Key = 'IdentityConnection'; LocalDb = 'AsfIdentity_Local'; File = 'identity.bacpac' }
)

foreach ($target in $targets) {
    $source   = $production[$target.Key]
    $remoteDb = Get-DatabaseName $source
    $bacpac   = Join-Path $OutDir $target.File

    Write-Host ''
    Write-Host ("=== {0} ===" -f $target.Key) -ForegroundColor White
    Write-Host ("مصدر : {0} (الإنتاج - قراءة فقط)" -f $remoteDb) -ForegroundColor DarkGray
    Write-Host ("وجهة : {0}" -f $target.LocalDb) -ForegroundColor DarkGray

    Write-Host 'تصدير البنية والبيانات... (قد يستغرق دقائق)' -ForegroundColor Yellow
    if (Test-Path $bacpac) { Remove-Item $bacpac -Force }
    & sqlpackage /Action:Export `
        /SourceConnectionString:$source `
        /TargetFile:$bacpac `
        /p:VerifyExtraction=False `
        /q:True
    if ($LASTEXITCODE -ne 0) { throw "فشل التصدير من $remoteDb" }

    $sizeMb = [math]::Round((Get-Item $bacpac).Length / 1MB, 1)
    Write-Host ("تم التصدير: {0} ({1} ميجابايت)" -f $target.File, $sizeMb) -ForegroundColor Green

    # الاستيراد ينشئ القاعدة، فلا بد من إسقاط الموجودة أولاً
    Write-Host 'إسقاط القاعدة المحلية القديمة...' -ForegroundColor Yellow
    $drop = "IF DB_ID('$($target.LocalDb)') IS NOT NULL BEGIN ALTER DATABASE [$($target.LocalDb)] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$($target.LocalDb)]; END"
    & sqlcmd -S $LocalServer -E -C -Q $drop | Out-Null

    $localCs = "Data Source=$LocalServer;Initial Catalog=$($target.LocalDb);Integrated Security=True;Encrypt=False;TrustServerCertificate=True;"

    Write-Host 'استيراد محلياً...' -ForegroundColor Yellow
    & sqlpackage /Action:Import `
        /SourceFile:$bacpac `
        /TargetConnectionString:$localCs `
        /q:True
    if ($LASTEXITCODE -ne 0) { throw "فشل الاستيراد إلى $($target.LocalDb)" }

    Write-Host ("تم إنشاء {0}" -f $target.LocalDb) -ForegroundColor Green
}

Write-Host ''
Write-Host '=== حجم البيانات المحلية ===' -ForegroundColor White
foreach ($db in @('AsfDefault_Local', 'AsfIdentity_Local')) {
    $query = @"
SET NOCOUNT ON;
SELECT TOP 8 t.name + ' : ' + CAST(SUM(p.rows) AS VARCHAR(20))
FROM sys.tables t JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1)
GROUP BY t.name HAVING SUM(p.rows) > 0 ORDER BY SUM(p.rows) DESC;
"@
    Write-Host ("--- {0} ---" -f $db)
    & sqlcmd -S $LocalServer -E -C -d $db -h -1 -W -Q $query
}
