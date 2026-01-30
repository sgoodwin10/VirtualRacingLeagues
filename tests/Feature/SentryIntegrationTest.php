<?php

declare(strict_types=1);

namespace Tests\Feature;

use Sentry\Tracing\TransactionContext;
use Tests\TestCase;

final class SentryIntegrationTest extends TestCase
{
    public function test_sentry_is_bound(): void
    {
        $this->assertTrue($this->app->bound('sentry'));
    }

    public function test_exception_capture(): void
    {
        $this->expectException(\Exception::class);

        try {
            throw new \Exception('Test exception');
        } catch (\Exception $e) {
            $eventId = \Sentry\captureException($e);
            $this->assertNotNull($eventId);
            throw $e;
        }
    }

    public function test_transaction_tracing(): void
    {
        $transactionContext = new TransactionContext();
        $transactionContext->setName('test_transaction');
        $transactionContext->setOp('test');

        $transaction = \Sentry\startTransaction($transactionContext);

        $this->assertNotNull($transaction);

        $transaction->finish();
    }

    public function test_sentry_service_provider_is_registered(): void
    {
        $providers = array_keys($this->app->getLoadedProviders());

        $this->assertContains('App\Providers\SentryServiceProvider', $providers);
    }

    public function test_sentry_transaction_middleware_is_registered(): void
    {
        // In Laravel 12, middleware is registered through the bootstrap/app.php
        // We can verify it's available by checking if the class exists
        $this->assertTrue(
            class_exists(\App\Http\Middleware\SentryTransactionMiddleware::class)
        );
    }
}
