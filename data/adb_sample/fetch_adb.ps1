$ErrorActionPreference = 'Stop'
$adbUrl = 'https://kidb.adb.org/api/v5/sdmx/data/ADB,DF_NA/A.NGDP_XDC.SIN?startPeriod=2020&endPeriod=2024&format=sdmx-csv'
$adbResponse = Invoke-WebRequest -Uri $adbUrl -UseBasicParsing -TimeoutSec 60
if ($adbResponse.Headers['Content-Type'] -notmatch 'text/csv') {
    throw 'ADB did not return CSV data.'
}
$adbRows = @($adbResponse.Content | ConvertFrom-Csv)
if ($adbRows.Count -eq 0 -or $null -eq $adbRows[0].OBS_VALUE) {
    throw 'ADB returned no observations or an unexpected schema.'
}
$adbOutput = Join-Path $PSScriptRoot 'singapore_gdp_2020_2024.csv'
[System.IO.File]::WriteAllText($adbOutput, $adbResponse.Content, [System.Text.UTF8Encoding]::new($false))
Write-Output "HTTP $($adbResponse.StatusCode): saved $($adbRows.Count) observations to $adbOutput"
$adbRows | Select-Object ECONOMY_CODE, TIME_PERIOD, OBS_VALUE, UNIT, UNIT_MULT | Format-Table
