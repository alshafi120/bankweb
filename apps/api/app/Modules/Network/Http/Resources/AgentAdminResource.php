<?php

namespace App\Modules\Network\Http\Resources;

use App\Modules\Network\Infrastructure\Models\Agent;
use App\Support\Admin\Field;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;

class AgentAdminResource extends LocationAdminResource
{
    public function key(): string
    {
        return 'agents';
    }

    public function model(): string
    {
        return Agent::class;
    }

    protected function specificFields(): array
    {
        return ['agentCode' => Field::string('agent_code', false, 40)];
    }

    public function extraRules(bool $creating, ?Model $model): array
    {
        return [
            'agentCode' => [$creating ? 'required' : 'sometimes', 'string', 'max:40', 'regex:/^[A-Za-z0-9-]+$/',
                Rule::unique('agents', 'agent_code')->ignore($model?->getKey())],
        ];
    }

    public function sorts(): array
    {
        return parent::sorts() + ['agentCode' => 'agent_code'];
    }
}
