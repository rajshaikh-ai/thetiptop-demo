import type { Product } from '@/lib/types';

// Until the real photo shoot, each dish gets a warm illustrated placeholder
// (a plate on a tinted ground) instead of misleading stock photography.
// The owner can upload a real photo from the admin menu manager.

const tints: Record<string, [string, string, string]> = {
  biryani: ['#F6D9A8', '#E9B872', '#B86B1F'],
  'main-non-veg': ['#F5C6A5', '#E58F5E', '#A4401A'],
  'main-veg': ['#E3E8B8', '#C2CC7A', '#5E6B1C'],
  chaap: ['#F2D3B8', '#D9A37A', '#8A4B22'],
  chinese: ['#F7C9B9', '#E58E77', '#9C2F1C'],
  breads: ['#F3E2C2', '#DDBF86', '#8C6420'],
  rice: ['#F1EBD8', '#D8CCA5', '#76663A'],
  raita: ['#E6EEF0', '#BFD3D8', '#3F6670'],
  thali: ['#EFDCC4', '#D2AE80', '#7A5126'],
};

export function DishImage({ product, className = '', rounded = 'rounded-xl' }: { product: Product; className?: string; rounded?: string }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name} className={`object-cover ${rounded} ${className}`} />;
  }
  const [bg, mid, ink] = tints[product.categoryId] || tints.thali;
  const initials = product.name
    .split(' ')
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} style={{ background: `linear-gradient(140deg, ${bg}, ${mid})` }} role="img" aria-label={`${product.name} (photo coming soon)`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle cx="50" cy="54" r="34" fill="#FFFFFF" opacity="0.92" />
        <circle cx="50" cy="54" r="25" fill={mid} opacity="0.55" />
        <circle cx="50" cy="54" r="25" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
        <text x="50" y="60" textAnchor="middle" fontSize="16" fontWeight="800" fill={ink} fontFamily="Plus Jakarta Sans, system-ui, sans-serif">{initials}</text>
        <path d="M14 20c4-6 10-6 14 0" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" fill="none" />
        <path d="M74 16c3-5 8-5 11 0" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}
