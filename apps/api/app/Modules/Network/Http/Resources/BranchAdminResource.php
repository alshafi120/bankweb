<?php

namespace App\Modules\Network\Http\Resources;

use App\Modules\Network\Infrastructure\Models\Branch;
use App\Support\Admin\Field;

class BranchAdminResource extends LocationAdminResource
{
    public function key(): string
    {
        return 'branches';
    }

    public function model(): string
    {
        return Branch::class;
    }

    protected function specificFields(): array
    {
        return ['managerName' => Field::string('manager_name', false, 120),];
    }
}
