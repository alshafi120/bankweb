<?php

namespace App\Modules\Content\Application\Services;

use App\Modules\Media\Infrastructure\Models\Media;
use App\Support\Security\HtmlSanitizer;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Per-type validation of page-section `data` against `BlockDataMap` (packages/api-types), plus
 * normalisation: rich text sanitised, MediaRef re-resolved from the media library (client-supplied
 * URLs are never trusted), unknown keys dropped. `home:<type>` blocks carry `{}`.
 */
final class BlockSchema
{
    public const TYPES = ['hero', 'text', 'image', 'cards', 'features', 'statistics', 'faq', 'cta', 'gallery', 'video', 'map', 'people', 'documents'];

    public const HOME_TYPES = PublicContentQuery::HOME_SECTIONS;

    private const ICONS = ['account', 'financing', 'transfer', 'card', 'payment', 'digital', 'send', 'receive', 'branch', 'shield', 'network', 'speed', 'eye', 'support', 'mobile', 'web', 'wallet', 'qr'];

    /** @return list<string> */
    public static function allTypes(): array
    {
        return [...self::TYPES, ...array_map(fn ($t) => 'home:'.$t, self::HOME_TYPES)];
    }

    /**
     * Validate & normalise one block. `$path` prefixes error keys (e.g. "3.data").
     *
     * @throws ValidationException
     */
    public static function normalize(string $type, mixed $data, string $path = 'data'): array|object
    {
        if (str_starts_with($type, 'home:')) {
            return (object) [];
        }
        $data = is_array($data) ? $data : [];

        $validator = Validator::make($data, self::rules($type));
        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->messages() as $key => $messages) {
                $errors[$path.'.'.$key] = $messages;
            }
            throw ValidationException::withMessages($errors);
        }

        return self::clean($type, $validator->validated(), $path);
    }

    /** @return array<string, list<mixed>> */
    private static function rules(string $type): array
    {
        $loc = fn (string $k, bool $required = true, int $max = 500) => [
            $k => [$required ? 'required' : 'nullable', 'array:ar,en'],
            "{$k}.ar" => [$required ? 'required' : 'nullable', 'nullable', 'string', 'max:'.$max],
            "{$k}.en" => [$required ? 'required' : 'nullable', 'nullable', 'string', 'max:'.$max],
        ];
        $media = fn (string $k, bool $required = false) => [
            $k => [$required ? 'required' : 'nullable', 'array'],
            "{$k}.id" => [$required ? 'required' : 'required_with:'.$k, 'integer'],
        ];
        $link = fn (string $k, bool $required = false) => [
            $k => [$required ? 'required' : 'nullable', 'array'],
            // Label is only required when the link object itself is present.
            "{$k}.label" => ['required_with:'.$k, 'array:ar,en'],
            "{$k}.label.ar" => ['required_with:'.$k, 'nullable', 'string', 'max:120'],
            "{$k}.label.en" => ['required_with:'.$k, 'nullable', 'string', 'max:120'],
            "{$k}.href" => ['required_with:'.$k, 'string', 'max:500', 'regex:#^(https?://|/|\#|mailto:|tel:)#i'],
        ];
        $items = fn (int $max = 30) => ['items' => ['required', 'array', 'min:1', 'max:'.$max]];

        return match ($type) {
            'hero' => [...$loc('title', true, 255), ...$loc('subtitle', false, 1000), ...$media('image'), ...$link('primary'), ...$link('secondary')],
            'text' => [...$loc('heading', false, 255), 'body' => ['required', 'array:ar,en'], 'body.ar' => ['required', 'string', 'max:100000'], 'body.en' => ['required', 'string', 'max:100000']],
            'image' => [...$media('image', true), ...$loc('caption', false, 500)],
            'cards' => [...$loc('heading', false, 255), ...$items(),
                'items.*.icon' => ['nullable', 'in:'.implode(',', self::ICONS)],
                ...self::prefix($loc('title', true, 255), 'items.*'), ...self::prefix($loc('body', true, 2000), 'items.*'),
                'items.*.href' => ['nullable', 'string', 'max:500', 'regex:#^(https?://|/|\#)#i']],
            'features' => [...$loc('heading', false, 255), ...$loc('body', false, 2000), ...$items(),
                'items.*.icon' => ['required', 'in:'.implode(',', self::ICONS)],
                ...self::prefix($loc('title', true, 255), 'items.*'), ...self::prefix($loc('body', true, 2000), 'items.*')],
            'statistics' => [...$loc('heading', false, 255), ...$items(12),
                'items.*.value' => ['required', 'numeric', 'min:0', 'max:1000000000000'],
                'items.*.suffix' => ['nullable', 'string', 'max:8'],
                ...self::prefix($loc('label', true, 120), 'items.*')],
            'faq' => [...$loc('heading', false, 255), ...$items(50),
                ...self::prefix($loc('question', true, 500), 'items.*'), ...self::prefix($loc('answer', true, 5000), 'items.*')],
            'cta' => [...$loc('title', true, 255), ...$loc('body', false, 1000), ...$link('primary', true), ...$link('secondary')],
            'gallery' => [...$loc('heading', false, 255), 'images' => ['required', 'array', 'min:1', 'max:40'], 'images.*.id' => ['required', 'integer']],
            'video' => [...$loc('heading', false, 255), 'url' => ['required', 'string', 'max:500', 'url:https'], ...$media('poster')],
            'map' => [...$loc('heading', false, 255), 'type' => ['nullable', 'in:branch,atm,agent'], 'city' => ['nullable', 'string', 'max:80']],
            'people' => [...$loc('heading', false, 255), ...$items(40),
                ...self::prefix($loc('name', true, 160), 'items.*'), ...self::prefix($loc('role', true, 160), 'items.*'),
                ...self::prefix($loc('bio', false, 2000), 'items.*'), ...self::prefix($media('photo'), 'items.*')],
            'documents' => [...$loc('heading', false, 255), ...$items(100),
                ...self::prefix($loc('title', true, 255), 'items.*'),
                'items.*.year' => ['nullable', 'integer', 'min:1990', 'max:2100'],
                ...self::prefix($media('file', true), 'items.*')],
            default => throw ValidationException::withMessages(['type' => ['Unknown block type.']]),
        };
    }

    /** @param  array<string, mixed>  $rules */
    private static function prefix(array $rules, string $prefix): array
    {
        $out = [];
        foreach ($rules as $k => $v) {
            $out[$prefix.'.'.$k] = is_array($v)
                ? array_map(fn ($r) => is_string($r) && str_starts_with($r, 'required_with:') ? 'required_with:'.$prefix.'.'.substr($r, 14) : $r, $v)
                : $v;
        }

        return $out;
    }

    private static function clean(string $type, array $d, string $path): array
    {
        $l = fn ($v) => is_array($v) ? ['ar' => trim((string) ($v['ar'] ?? '')), 'en' => trim((string) ($v['en'] ?? ''))] : null;
        $lReq = fn ($v) => $l($v) ?? ['ar' => '', 'en' => ''];
        $html = fn ($v) => ['ar' => HtmlSanitizer::clean((string) ($v['ar'] ?? '')), 'en' => HtmlSanitizer::clean((string) ($v['en'] ?? ''))];
        $link = fn ($v) => is_array($v) && isset($v['href']) ? ['label' => $lReq($v['label'] ?? null), 'href' => (string) $v['href']] : null;
        $media = function ($v, string $key) use ($path) {
            if (! is_array($v) || ! isset($v['id'])) {
                return null;
            }
            $m = Media::query()->find((int) $v['id']);
            if (! $m) {
                throw ValidationException::withMessages([$path.'.'.$key => ['The selected media does not exist.']]);
            }

            return $m->toRef();
        };

        return match ($type) {
            'hero' => ['title' => $lReq($d['title']), 'subtitle' => $l($d['subtitle'] ?? null), 'image' => $media($d['image'] ?? null, 'image'), 'primary' => $link($d['primary'] ?? null), 'secondary' => $link($d['secondary'] ?? null)],
            'text' => ['heading' => $l($d['heading'] ?? null), 'body' => $html($d['body'])],
            'image' => ['image' => $media($d['image'], 'image'), 'caption' => $l($d['caption'] ?? null)],
            'cards' => ['heading' => $l($d['heading'] ?? null), 'items' => array_map(fn ($i) => array_filter([
                'icon' => $i['icon'] ?? null, 'title' => $lReq($i['title']), 'body' => $lReq($i['body']), 'href' => $i['href'] ?? null,
            ], fn ($v, $k) => $k !== 'icon' || $v !== null, ARRAY_FILTER_USE_BOTH), $d['items'])],
            'features' => ['heading' => $l($d['heading'] ?? null), 'body' => $l($d['body'] ?? null), 'items' => array_map(fn ($i) => [
                'icon' => $i['icon'], 'title' => $lReq($i['title']), 'body' => $lReq($i['body']),
            ], $d['items'])],
            'statistics' => ['heading' => $l($d['heading'] ?? null), 'items' => array_map(fn ($i) => array_filter([
                'value' => PublicContentPresenter::number($i['value']), 'suffix' => $i['suffix'] ?? null, 'label' => $lReq($i['label']),
            ], fn ($v) => $v !== null), $d['items'])],
            'faq' => ['heading' => $l($d['heading'] ?? null), 'items' => array_map(fn ($i) => ['question' => $lReq($i['question']), 'answer' => $lReq($i['answer'])], $d['items'])],
            'cta' => ['title' => $lReq($d['title']), 'body' => $l($d['body'] ?? null), 'primary' => $link($d['primary']), 'secondary' => $link($d['secondary'] ?? null)],
            'gallery' => ['heading' => $l($d['heading'] ?? null), 'images' => array_values(array_map(fn ($img, $i) => $media($img, "images.$i"), $d['images'], array_keys($d['images'])))],
            'video' => ['heading' => $l($d['heading'] ?? null), 'url' => (string) $d['url'], 'poster' => $media($d['poster'] ?? null, 'poster')],
            'map' => ['heading' => $l($d['heading'] ?? null), 'type' => $d['type'] ?? null, 'city' => $d['city'] ?? null],
            'people' => ['heading' => $l($d['heading'] ?? null), 'items' => array_values(array_map(fn ($p, $i) => [
                'name' => $lReq($p['name']), 'role' => $lReq($p['role']), 'bio' => $l($p['bio'] ?? null), 'photo' => $media($p['photo'] ?? null, "items.$i.photo"),
            ], $d['items'], array_keys($d['items'])))],
            'documents' => ['heading' => $l($d['heading'] ?? null), 'items' => array_values(array_map(fn ($doc, $i) => [
                'title' => $lReq($doc['title']), 'year' => isset($doc['year']) ? (int) $doc['year'] : null, 'file' => $media($doc['file'], "items.$i.file"),
            ], $d['items'], array_keys($d['items'])))],
        };
    }
}
