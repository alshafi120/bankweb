<?php

/*
| Strict allow-list for every rich-text field (news content, page "text" blocks, service/financing
| bodies, job descriptions, FAQ answers). No inline styles, no scripts, no iframes, no event handlers,
| links limited to http/https/mailto/tel and forced rel="noopener noreferrer".
*/
return [
    'encoding' => 'UTF-8',
    'finalize' => true,
    'ignoreNonStrings' => false,
    'cachePath' => storage_path('app/purifier'),
    'cacheFileMode' => 0755,
    'settings' => [
        'default' => [
            'HTML.Doctype' => 'HTML 4.01 Transitional',
            'HTML.Allowed' => 'p,br,strong,b,em,i,u,h2,h3,h4,ul,ol,li,blockquote,a[href|title],table,thead,tbody,tr,th,td',
            'CSS.AllowedProperties' => '',
            'Attr.AllowedFrameTargets' => [],
            'Attr.AllowedRel' => ['noopener', 'noreferrer', 'nofollow'],
            'HTML.TargetNoopener' => true,
            'HTML.TargetNoreferrer' => true,
            'HTML.Nofollow' => false,
            'URI.AllowedSchemes' => ['http' => true, 'https' => true, 'mailto' => true, 'tel' => true],
            'URI.DisableExternalResources' => true,
            'AutoFormat.AutoParagraph' => false,
            'AutoFormat.RemoveEmpty' => true,
            'Core.EscapeInvalidTags' => false,
        ],
        'plain' => [
            'HTML.Allowed' => '',
        ],
    ],
];
