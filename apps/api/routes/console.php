<?php

use Illuminate\Support\Facades\Schedule;

/* Crontab: * * * * * cd /var/www/api && php artisan schedule:run >> /dev/null 2>&1 */

Schedule::command('content:publish-scheduled')->everyMinute()->withoutOverlapping()->onOneServer();
Schedule::command('analytics:prune --days=400')->dailyAt('02:30')->onOneServer();
Schedule::command('auth:clear-resets')->everyFifteenMinutes();
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('queue:prune-failed --hours=720')->daily();
