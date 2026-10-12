<?php

namespace App\Modules\Applications\Infrastructure\Jobs;

use App\Modules\Applications\Infrastructure\Mail\NewSubmissionMail;
use App\Modules\Applications\Infrastructure\Models\Application;
use App\Modules\Applications\Infrastructure\Models\Complaint;
use App\Modules\Applications\Infrastructure\Models\ContactRequest;
use App\Modules\Applications\Infrastructure\Models\JobApplication;
use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Mail;

/**
 * Queued e-mail to the staff responsible for a request type. Contains the reference and type only —
 * never personal data — and a link to the dashboard.
 */
class NotifyStaffOfSubmission implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public function __construct(public string $kind, public int $id) {}

    public function handle(): void
    {
        $model = match ($this->kind) {
            'applications' => Application::class,
            'contact-requests' => ContactRequest::class,
            'complaints' => Complaint::class,
            'job-applications' => JobApplication::class,
        };
        $record = $model::query()->find($this->id);
        if (! $record) {
            return;
        }

        $recipients = $this->recipients();
        if ($recipients === []) {
            return;
        }

        $type = $record instanceof Application ? $record->type : $this->kind;
        Mail::to($recipients)->send(new NewSubmissionMail($record->reference, $type, $this->kind, $record->id));
    }

    /** FORMS_NOTIFY_EMAIL (comma separated) or active users holding `<kind>.view`. */
    private function recipients(): array
    {
        $configured = array_values(array_filter(array_map('trim', explode(',', (string) config('bank.forms.notify_email')))));
        if ($configured !== []) {
            return $configured;
        }

        $permission = $this->kind.'.view';

        return User::query()->where('is_active', true)
            ->whereHas('roles', fn ($q) => $q->where('name', '!=', 'super_admin')
                ->whereHas('permissions', fn ($p) => $p->where('name', $permission)))
            ->limit(20)->pluck('email')->all();
    }
}
