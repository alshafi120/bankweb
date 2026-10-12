<?php

namespace App\Modules\Network\Http\Resources;

use App\Modules\Network\Infrastructure\Models\Atm;
use App\Support\Admin\Field;

class AtmAdminResource extends LocationAdminResource
{
    public function key(): string
    {
        return 'atms';
    }

    public function model(): string
    {
        return Atm::class;
    }

    protected function specificFields(): array
    {
        return ['is24h' => Field::bool('is_24h'), 'supportsDeposit' => Field::bool('supports_deposit'),];
    }
}
