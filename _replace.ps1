$filePath = "c:\Users\pablo hh\Documents\programacion de obra terminaciones\programación de obra\control_victoria_v9.html"
$jsPath   = "c:\Users\pablo hh\Documents\programacion de obra terminaciones\programación de obra\_edit_mat.js"

$html   = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
$newBlk = [System.IO.File]::ReadAllText($jsPath,   [System.Text.Encoding]::UTF8)

$anchor = "            h('div',{style:{padding:'8px 14px'}},"
$start  = $html.IndexOf($anchor)
$after  = $html.Substring($start)

$em     = "`r`n            )`r`n"
$relEnd = $after.IndexOf($em)
$absEnd = $start + $relEnd + $em.Length

Write-Host "start=$start absEnd=$absEnd length=$($absEnd - $start)"

$newHtml = $html.Substring(0, $start) + $newBlk + "`r`n" + $html.Substring($absEnd)
[System.IO.File]::WriteAllText($filePath, $newHtml, [System.Text.Encoding]::UTF8)

$check = $newHtml.Contains("isEditing")
Write-Host "isEditing=$check"
Write-Host "Done"
