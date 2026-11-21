export function blogShareLinks(url: string, title: string) {
  const encoded = encodeURIComponent(url);
  return [
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    },
    {
      name: 'Facebook',
      icon: 'facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      name: 'LinkedIn',
      icon: 'linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
    {
      name: 'X',
      icon: 'twitter-x',
      url: `https://twitter.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`,
    },
  ];
}
