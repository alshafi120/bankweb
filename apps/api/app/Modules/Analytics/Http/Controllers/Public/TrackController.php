<?php

namespace App\Modules\Analytics\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Analytics\Application\Actions\RecordPageView;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** POST /track `{ path, referrer? }` → 204. Cookieless; IP hashed with a daily salt, never stored raw. */
class TrackController extends Controller
{
    public function __invoke(Request $request, RecordPageView $record): Response
    {
        $data = $request->validate([
            'path' => ['required', 'string', 'max:300', 'regex:#^/[\w\-./%]*$#'],
            'referrer' => ['nullable', 'string', 'max:500'],
        ]);

        $record($data['path'], $data['referrer'] ?? null, $request->ip(), $request->userAgent());

        return response()->noContent();
    }
}
