<?php

namespace App\Modules\Catalog\Http\Resources;

use App\Modules\Catalog\Infrastructure\Models\Service;
use App\Support\Admin\AdminResource;
use App\Support\Admin\Field;

class ServiceAdminResource extends AdminResource
{
    public const ICONS = ['account', 'financing', 'transfer', 'card', 'payment', 'digital', 'send', 'receive', 'branch', 'shield', 'network', 'speed', 'eye', 'support', 'mobile', 'web', 'wallet', 'qr'];

    public function key(): string
    {
        return 'services';
    }

    public function model(): string
    {
        return Service::class;
    }

    public function fields(): array
    {
        return [
            'slug' => Field::slug(),
            'icon' => Field::enum('icon', self::ICONS),
            'title' => Field::localized('title', true),
            'summary' => Field::localized('summary', false, 1000),
            'body' => Field::html('body'),
            'href' => Field::url('href', true),
        ];
    }

    public function searchable(): array
    {
        return ['title_ar', 'title_en', 'slug'];
    }
}
