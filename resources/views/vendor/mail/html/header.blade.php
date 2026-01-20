@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
{{-- Replace with your logo URL or keep as text --}}
<span style="font-size: 24px; font-weight: bold; color: #3d4852;">
{{ config('app.name') }}
</span>
</a>
</td>
</tr>
