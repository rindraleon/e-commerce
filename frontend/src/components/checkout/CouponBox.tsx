import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface CouponBoxProps {
  inputCode: string;
  setInputCode: (value: string) => void;
  isValidating: boolean;
  appliedCode?: string | null;
  appliedDescription?: string | null;
  discountAmount: number;
  onApply: () => Promise<unknown>;
  onRemove: () => void;
}

const CouponBox = ({
  inputCode,
  setInputCode,
  isValidating,
  appliedCode,
  appliedDescription,
  discountAmount,
  onApply,
  onRemove,
}: CouponBoxProps) => {
  const { lang } = useLanguage();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="couponCode">
          {lang === 'fr' ? 'Code promo' : 'Promo code'}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="couponCode"
            value={inputCode}
            onChange={(event) => setInputCode(event.target.value.toUpperCase())}
            placeholder={lang === 'fr' ? 'Ex: BIENVENUE10' : 'Eg: WELCOME10'}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void onApply();
            }}
            disabled={isValidating || !inputCode.trim()}
          >
            {isValidating
              ? lang === 'fr'
                ? 'Vérification...'
                : 'Checking...'
              : lang === 'fr'
                ? 'Appliquer'
                : 'Apply'}
          </Button>
        </div>
      </div>

      {appliedCode ? (
        <div className="rounded-lg bg-accent/10 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-accent-foreground">
                {lang === 'fr' ? 'Coupon appliqué' : 'Coupon applied'}: {appliedCode}
              </p>
              {appliedDescription ? (
                <p className="text-muted-foreground">{appliedDescription}</p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
              {lang === 'fr' ? 'Retirer' : 'Remove'}
            </Button>
          </div>
          <p className="mt-2 font-medium text-primary">
            {lang === 'fr' ? 'Remise' : 'Discount'}: -${discountAmount.toFixed(2)}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default CouponBox;
