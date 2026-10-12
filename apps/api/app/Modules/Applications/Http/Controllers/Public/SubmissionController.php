<?php

namespace App\Modules\Applications\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Modules\Applications\Application\Actions\SubmitPublicRequest;
use App\Modules\Applications\Http\Requests\StoreApplicationRequest;
use App\Modules\Applications\Http\Requests\StoreComplaintRequest;
use App\Modules\Applications\Http\Requests\StoreContactRequest;
use App\Modules\Applications\Http\Requests\StoreJobApplicationRequest;
use App\Modules\Careers\Infrastructure\Models\Job;
use Illuminate\Http\JsonResponse;

/**
 * Public forms → `201 { data: { reference } }`. Protection chain per route:
 * throttle:forms (5/min + 30/day per IP per form) → honeypot (fake 201) → FormRequest (+ Turnstile).
 */
class SubmissionController extends Controller
{
    public function __construct(private readonly SubmitPublicRequest $submit) {}

    public function application(StoreApplicationRequest $request): JsonResponse
    {
        return $this->created($this->submit->application($request->validated(), $request->ip(), $request->userAgent()));
    }

    public function contact(StoreContactRequest $request): JsonResponse
    {
        return $this->created($this->submit->contact($request->validated(), $request->ip()));
    }

    public function complaint(StoreComplaintRequest $request): JsonResponse
    {
        return $this->created($this->submit->complaint($request->safe()->except('attachment'), $request->file('attachment'), $request->ip()));
    }

    public function jobApplication(StoreJobApplicationRequest $request, string $slug): JsonResponse
    {
        $job = Job::query()->open()->where('slug', $slug)->firstOrFail();

        return $this->created($this->submit->jobApplication($job, $request->safe()->except('cv'), $request->file('cv'), $request->ip()));
    }

    private function created(string $reference): JsonResponse
    {
        return response()->json(['data' => ['reference' => $reference]], 201, ['Cache-Control' => 'no-store']);
    }
}
