$path = "c:\Users\LENOVO\Documents\Proyectos\Liga de Basket de Iquitos\liga-basket-iquitos\src\lib\actions\system-dashboard.ts"
$content = Get-Content -Path $path -Raw

# Replace revalidateTag(arg) with revalidateTag(arg, "profile" as any)
$content = $content -replace 'revalidateTag\("([^"]+)"\)', 'revalidateTag("$1", "profile" as any)'

# Replace revalidatePath(arg) with revalidatePath(arg, "page" as any)
$content = $content -replace 'revalidatePath\((`[^`]+`|"[^"]+"),?\)', 'revalidatePath($1, "page" as any)'

Set-Content -Path $path -Value $content -NoNewline
