<?php

declare(strict_types=1);

namespace App\Infrastructure\Notifications\Messages;

final class DiscordMessage
{
    public ?string $webhookUrl = null;
    public ?string $content = null;

    /**
     * @var array<array<string, mixed>>
     */
    public array $embeds = [];

    public ?string $username = null;
    public ?string $avatarUrl = null;

    /**
     * @var array<string, mixed>
     */
    private array $currentEmbed = [];

    public function webhookUrl(string $url): self
    {
        $this->webhookUrl = $url;
        return $this;
    }

    public function content(string $content): self
    {
        $this->content = $content;
        return $this;
    }

    public function username(string $username): self
    {
        $this->username = $username;
        return $this;
    }

    public function avatarUrl(string $avatarUrl): self
    {
        $this->avatarUrl = $avatarUrl;
        return $this;
    }

    /**
     * @param array<string, mixed> $embed
     */
    public function embed(array $embed): self
    {
        $this->embeds[] = $embed;
        return $this;
    }

    public function title(string $title): self
    {
        $this->currentEmbed['title'] = $title;
        return $this;
    }

    public function description(string $description): self
    {
        $this->currentEmbed['description'] = $description;
        return $this;
    }

    public function color(int $color): self
    {
        $this->currentEmbed['color'] = $color;
        return $this;
    }

    public function field(string $name, string $value, bool $inline = false): self
    {
        if (!isset($this->currentEmbed['fields'])) {
            $this->currentEmbed['fields'] = [];
        }

        $this->currentEmbed['fields'][] = [
            'name' => $name,
            'value' => $value,
            'inline' => $inline,
        ];

        return $this;
    }

    public function timestamp(string $timestamp): self
    {
        $this->currentEmbed['timestamp'] = $timestamp;
        return $this;
    }

    public function footer(string $text, ?string $iconUrl = null): self
    {
        $footer = ['text' => $text];
        if ($iconUrl !== null) {
            $footer['icon_url'] = $iconUrl;
        }
        $this->currentEmbed['footer'] = $footer;
        return $this;
    }

    public function thumbnail(string $url): self
    {
        $this->currentEmbed['thumbnail'] = ['url' => $url];
        return $this;
    }

    public function image(string $url): self
    {
        $this->currentEmbed['image'] = ['url' => $url];
        return $this;
    }

    public function author(string $name, ?string $url = null, ?string $iconUrl = null): self
    {
        $author = ['name' => $name];
        if ($url !== null) {
            $author['url'] = $url;
        }
        if ($iconUrl !== null) {
            $author['icon_url'] = $iconUrl;
        }
        $this->currentEmbed['author'] = $author;
        return $this;
    }

    public function finishEmbed(): self
    {
        if (!empty($this->currentEmbed)) {
            $this->embeds[] = $this->currentEmbed;
            $this->currentEmbed = [];
        }
        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        // Finish current embed if not empty
        if (!empty($this->currentEmbed)) {
            $this->finishEmbed();
        }

        $payload = [];

        if ($this->content !== null) {
            $payload['content'] = $this->content;
        }

        if (!empty($this->embeds)) {
            $payload['embeds'] = $this->embeds;
        }

        if ($this->username !== null) {
            $payload['username'] = $this->username;
        }

        if ($this->avatarUrl !== null) {
            $payload['avatar_url'] = $this->avatarUrl;
        }

        return $payload;
    }
}
