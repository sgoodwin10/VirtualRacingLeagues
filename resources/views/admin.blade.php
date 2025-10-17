<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'YOUR_APP_NAME') }} - Admin Dashboard</title>
        @vite(['resources/admin/css/app.css', 'resources/admin/js/app.ts'])
    </head>
    <body>
        <div id="admin-app"></div>
    </body>
</html>
