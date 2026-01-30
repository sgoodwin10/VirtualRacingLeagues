<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Sentry\Tracing\SpanStatus;
use Sentry\Tracing\TransactionContext;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class SentryTransactionMiddleware
{
    /**
     * Handle an incoming request and wrap it in a Sentry transaction.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->bound('sentry')) {
            return $next($request);
        }

        $transactionContext = new TransactionContext();
        $transactionContext->setName($this->getTransactionName($request));
        $transactionContext->setOp('http.server');

        $transaction = \Sentry\startTransaction($transactionContext);

        \Sentry\configureScope(function (\Sentry\State\Scope $scope) use ($transaction): void {
            $scope->setSpan($transaction);
        });

        $transaction->setData([
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'route' => $request->route()?->getName(),
        ]);

        try {
            $response = $next($request);
            $transaction->setHttpStatus($response->getStatusCode());
            $transaction->setStatus(SpanStatus::ok());

            return $response;
        } catch (Throwable $e) {
            $transaction->setStatus(SpanStatus::internalError());
            throw $e;
        } finally {
            $transaction->finish();
        }
    }

    /**
     * Get the transaction name for the request.
     */
    protected function getTransactionName(Request $request): string
    {
        $route = $request->route();

        if ($route) {
            return $request->method() . ' ' . ($route->getName() ?? $route->uri());
        }

        return $request->method() . ' ' . $request->path();
    }
}
