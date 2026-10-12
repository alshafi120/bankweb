<?php

namespace App\Providers;

use App\Modules\Integration\Adapters\NullCoreBankingAdapter;
use App\Modules\Integration\Adapters\NullEmailAdapter;
use App\Modules\Integration\Adapters\NullKycAdapter;
use App\Modules\Integration\Adapters\NullRemittanceAdapter;
use App\Modules\Integration\Adapters\NullSmsAdapter;
use App\Modules\Integration\Application\Services\OutboxWriter;
use App\Modules\Integration\Ports\CoreBankingPort;
use App\Modules\Integration\Ports\EmailPort;
use App\Modules\Integration\Ports\KycPort;
use App\Modules\Integration\Ports\RemittancePort;
use App\Modules\Integration\Ports\SmsPort;
use Illuminate\Support\ServiceProvider;

/**
 * v1: every port is bound to a Null adapter. v1 never calls core banking and has no connection to it.
 * INTEGRATION_OUTBOX_ENABLED=true makes the Null adapters record intents in `integration_outbox`
 * for a future, separately deployed Integration Service to relay.
 */
class IntegrationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $enabled = (bool) config('bank.integration_outbox', false);

        $this->app->singleton(CoreBankingPort::class, fn ($app) => new NullCoreBankingAdapter($app->make(OutboxWriter::class), $enabled));
        $this->app->singleton(SmsPort::class, fn ($app) => new NullSmsAdapter($app->make(OutboxWriter::class), $enabled));
        $this->app->singleton(EmailPort::class, fn ($app) => new NullEmailAdapter($app->make(OutboxWriter::class), $enabled));
        $this->app->singleton(KycPort::class, fn ($app) => new NullKycAdapter($app->make(OutboxWriter::class), $enabled));
        $this->app->singleton(RemittancePort::class, NullRemittanceAdapter::class);
    }
}
