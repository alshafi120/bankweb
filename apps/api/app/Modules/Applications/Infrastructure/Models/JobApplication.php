<?php

namespace App\Modules\Applications\Infrastructure\Models;

use App\Modules\Applications\Infrastructure\Concerns\HasProtectedPii;
use App\Modules\Audit\Infrastructure\Concerns\Auditable;
use App\Modules\Careers\Infrastructure\Models\Job;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    use Auditable, HasProtectedPii;

    protected $fillable = [
        'reference', 'job_id', 'status', 'full_name', 'phone', 'email', 'city', 'education', 'experience_years',
        'cover_letter', 'cv_path', 'locale', 'assigned_to', 'ip_hash',
    ];

    protected $hidden = ['phone', 'phone_hash', 'ip_hash', 'cv_path'];

    protected function casts(): array
    {
        return ['phone' => 'encrypted', 'experience_years' => 'integer'];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class)->withTrashed();
    }

    public function auditResourceType(): string
    {
        return 'job-applications';
    }
}
