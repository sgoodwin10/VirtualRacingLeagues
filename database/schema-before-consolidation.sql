sh: 1: mysqldump: not found
sh: 1: mysqldump: not found

   Symfony\Component\Process\Exception\ProcessFailedException 

  The command "mysqldump  --user="${:LARAVEL_LOAD_USER}" --password="${:LARAVEL_LOAD_PASSWORD}" --host="${:LARAVEL_LOAD_HOST}" --port="${:LARAVEL_LOAD_PORT}" --no-tablespaces --skip-add-locks --skip-comments --skip-set-charset --tz-utc "${:LARAVEL_LOAD_DATABASE}" --routines --result-file="${:LARAVEL_LOAD_PATH}" --no-data" failed.

Exit Code: 127(Command not found)

Working directory: /var/www

Output:
================


Error Output:
================
sh: 1: mysqldump: not found

  at vendor/symfony/process/Process.php:269
    265▕      */
    266▕     public function mustRun(?callable $callback = null, array $env = []): static
    267▕     {
    268▕         if (0 !== $this->run($callback, $env)) {
  ➜ 269▕             throw new ProcessFailedException($this);
    270▕         }
    271▕ 
    272▕         return $this;
    273▕     }

      [2m+17 vendor frames [22m

  18  artisan:16
      Illuminate\Foundation\Application::handleCommand(Object(Symfony\Component\Console\Input\ArgvInput))

