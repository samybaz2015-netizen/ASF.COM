<#
.SYNOPSIS
    بناء الواجهة الأمامية ونشرها داخل الواجهة الخلفية، ليصير البرنامج رابطاً واحداً.

.DESCRIPTION
    ينتج بناء الإنتاج من React ثم ينسخه إلى wwwroot في مشروع الـ API، فيخدم
    الخادم التطبيق والخدمات والتوثيق من نفس المنفذ:

        http://localhost:5080            التطبيق
        http://localhost:5080/api/...    الخدمات
        http://localhost:5080/swagger    التوثيق

    عنوان الـ API في البناء يُترك فارغاً عمداً، فتصبح النداءات نسبية (/api/)
    وتعمل على أي منفذ أو نطاق دون إعادة بناء.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File tools\build-frontend.ps1
    powershell -ExecutionPolicy Bypass -File tools\build-frontend.ps1 -SkipInstall
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$KeepApiDomain
)

$ErrorActionPreference = 'Stop'

# npm و node يكتبان تحذيرات على stderr، وWindows PowerShell 5.1 يعاملها
# خطأً قاتلاً. نخفّف المعالجة حول النداءات الأصلية ونحكم برمز الخروج وحده.
$nativeErrorAction = 'Continue'

$root        = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$frontendDir = Join-Path $root 'src\frontend'
$buildDir    = Join-Path $frontendDir 'build'
$wwwroot     = Join-Path $root 'ASF.Solution.API\ASF.API\wwwroot'
# مجلد التشغيل: بناء .NET لا ينسخ wwwroot إلى المخرجات إلا عند النشر،
# والخادم يقرأ من هنا حين يُشغَّل من مجلد البناء.
$runtimeRoot = Join-Path $root 'ASF.Solution.API\ASF.API\bin\Debug\net8.0\wwwroot'

if (-not (Test-Path -LiteralPath $frontendDir)) { throw "لم أجد مجلد الواجهة: $frontendDir" }

Push-Location $frontendDir
try {
    if (-not $SkipInstall) {
        Write-Host 'تثبيت الحزم…' -ForegroundColor Yellow
        $ErrorActionPreference = $nativeErrorAction
        & npm install --no-audit --no-fund 2>&1 | Out-Host
        $ErrorActionPreference = 'Stop'
        if ($LASTEXITCODE -ne 0) { throw 'فشل تثبيت الحزم.' }
    }

    # نداءات نسبية: نفس أصل الخادم الذي يخدم الصفحة
    if (-not $KeepApiDomain) { $env:REACT_APP_API_DOMAIN = '' }

    # خرائط المصدر تكشف الكود كاملاً لأي زائر — أُطفئت في بناء الإنتاج
    $env:GENERATE_SOURCEMAP = 'false'
    $env:CI = 'false'   # حتى لا تُعامل التحذيرات كأخطاء

    Write-Host 'بناء الواجهة…' -ForegroundColor Yellow
    $ErrorActionPreference = $nativeErrorAction
    & npm run build 2>&1 | Out-Host
    $ErrorActionPreference = 'Stop'
    if ($LASTEXITCODE -ne 0) { throw 'فشل بناء الواجهة.' }
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $buildDir)) { throw "لم يُنتج البناء مجلد build." }

Write-Host 'نشر البناء داخل الخادم…' -ForegroundColor Yellow

if (Test-Path -LiteralPath $wwwroot) {
    # أبقِ ملفات الخادم الخاصة (مثل مجلد الصور المرفوعة) ولا تمسح إلا بناءً سابقاً
    Get-ChildItem -LiteralPath $wwwroot -Force |
        Where-Object { $_.Name -in @('static', 'index.html', 'asset-manifest.json', 'manifest.json', 'robots.txt') -or $_.Name -like '*.png' -or $_.Name -like '*.jpeg' -or $_.Name -like '*.ico' } |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
}

Copy-Item -Path (Join-Path $buildDir '*') -Destination $wwwroot -Recurse -Force

# وإلى مجلد التشغيل أيضاً ليعمل فوراً دون إعادة نشر
if (-not (Test-Path -LiteralPath $runtimeRoot)) {
    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
}
Copy-Item -Path (Join-Path $buildDir '*') -Destination $runtimeRoot -Recurse -Force

$files = (Get-ChildItem -LiteralPath $wwwroot -Recurse -File).Count
$size  = [math]::Round((Get-ChildItem -LiteralPath $wwwroot -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 1)

Write-Host ''
Write-Host ("نُشرت الواجهة: {0} ملفاً، {1} ميجابايت" -f $files, $size) -ForegroundColor Green
Write-Host ''
Write-Host 'البرنامج على رابط واحد:' -ForegroundColor Green
Write-Host '  http://localhost:5080            التطبيق'
Write-Host '  http://localhost:5080/swagger    توثيق الخدمات'
Write-Host ''
Write-Host 'أعد تشغيل الخادم لتفعيل النشر:' -ForegroundColor Yellow
Write-Host '  powershell -ExecutionPolicy Bypass -File local\run-api.ps1'
