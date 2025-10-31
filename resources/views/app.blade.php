<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'YOUR_APP_NAME') }} - User Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        @vite(['resources/app/css/app.css', 'resources/app/js/app.ts'])
    </head>
    <body class="min-h-full min-w-full bg-slate-50">
        <div id="user-app" class=""></div>
    </body>
</html>
