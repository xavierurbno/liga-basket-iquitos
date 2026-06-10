import Link from "next/link";

type Props = {
  message: string;
  upgradePath?: string | null;
};

export function PlanUpgradeCTA({ message, upgradePath }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-950">{message}</p>
      {upgradePath ? (
        <Link
          href={upgradePath}
          className="mt-2 inline-flex rounded-lg bg-[#005CEE] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#004bb8]"
        >
          Ampliar plan
        </Link>
      ) : null}
    </div>
  );
}
