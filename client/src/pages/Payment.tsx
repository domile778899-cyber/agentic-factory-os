import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  CreditCard, CheckCircle2, Loader2, Shield, Globe,
  ArrowRight, Copy, ExternalLink, AlertTriangle, DollarSign,
  Wallet, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PaymentModalProps {
  taskOrderId: number;
  taskTitle: string;
  budget: number;
  currency?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ taskOrderId, taskTitle, budget, currency = 'CNY', onClose, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const { data: methods } = trpc.payment.methods.useQuery();
  const createEscrow = trpc.payment.createEscrow.useMutation({
    onSuccess: (data) => { setPaymentResult(data); setStep('confirm'); },
    onError: (e) => toast.error(e.message),
  });
  const confirmPayment = trpc.payment.confirmPayment.useMutation({
    onSuccess: (data) => { setStep('done'); toast.success(data.message); setTimeout(onSuccess, 2000); },
    onError: (e) => toast.error(e.message),
  });

  const selectedMethodInfo = (methods || []).find((m: any) => m.key === selectedMethod);
  const platformFee = Math.round(budget * 0.1);
  const payeeAmount = budget - platformFee;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center">
              <Shield size={18} className="text-[var(--success)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">安全托管支付</h2>
              <p className="text-[10px] text-[var(--text-muted)]">资金由平台托管，任务完成后自动结算</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white"><X size={18} /></button>
        </div>

        {/* Task Info */}
        <div className="glass-card p-3 mb-4 border-[var(--brand-primary)]/20">
          <div className="text-xs text-[var(--text-muted)] mb-1">任务</div>
          <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{taskTitle}</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-[var(--text-muted)]">任务预算</div>
            <div className="text-lg font-extrabold text-[var(--success)]">¥{(budget / 100).toFixed(2)}</div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1">
            <span>平台服务费 (10%)</span>
            <span className="text-[var(--warning)]">-¥{(platformFee / 100).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] mt-0.5 pt-1 border-t border-[var(--border-subtle)]">
            <span className="text-[var(--text-secondary)]">接单者实得</span>
            <span className="text-[var(--success)] font-bold">¥{(payeeAmount / 100).toFixed(2)}</span>
          </div>
        </div>

        {step === 'select' && (
          <>
            <div className="text-xs font-medium text-[var(--text-muted)] mb-3 flex items-center gap-1">
              <Globe size={12} /> 选择支付方式
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(methods || []).map((method: any) => (
                <button key={method.key} onClick={() => setSelectedMethod(method.key)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${selectedMethod === method.key ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10' : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'}`}>
                  <span className="text-xl">{method.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">{method.name}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">
                      {method.feePercent > 0 ? `手续费 ${method.feePercent}%` : '零手续费'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedMethodInfo && (
              <div className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-lg p-2 mb-4">
                {selectedMethodInfo.description}
              </div>
            )}
            <Button onClick={() => createEscrow.mutate({ taskOrderId, amount: budget, currency, paymentMethod: selectedMethod as any })}
              disabled={!selectedMethod || createEscrow.isPending}
              className="btn-brand w-full gap-2 h-10">
              {createEscrow.isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              确认支付 ¥{(budget / 100).toFixed(2)}
            </Button>
          </>
        )}

        {step === 'confirm' && paymentResult && (
          <div className="space-y-4">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-2">支付说明</div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono">
              {paymentResult.instructions}
            </div>
            {paymentResult.paymentUrl && (
              <a href={paymentResult.paymentUrl} target="_blank" rel="noopener noreferrer">
                <Button className="btn-brand w-full gap-2 h-9 text-sm">
                  <ExternalLink size={14} /> 前往支付页面
                </Button>
              </a>
            )}
            <div className="flex items-center gap-2 text-[10px] text-[var(--warning)] bg-[var(--warning)]/10 rounded-lg p-2">
              <AlertTriangle size={11} />
              完成支付后点击下方按钮确认，资金将进入托管状态
            </div>
            <Button onClick={() => confirmPayment.mutate({ taskOrderId })} disabled={confirmPayment.isPending}
              className="w-full gap-2 h-9 bg-[var(--success)] hover:bg-[var(--success)]/80 text-white">
              {confirmPayment.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              我已完成支付，确认托管
            </Button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-6">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-[var(--success)]" />
            <div className="text-base font-bold text-white mb-1">支付成功！</div>
            <div className="text-xs text-[var(--text-secondary)]">资金已进入托管，任务已开始。接单者完成后您可释放款项。</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// 支付方式展示页
export default function PaymentPage() {
  const { data: methods } = trpc.payment.methods.useQuery();
  const { data: stats } = trpc.payment.stats.useQuery();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center">
          <Wallet size={20} className="text-[var(--success)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">全球支付通道</h1>
          <p className="text-sm text-[var(--text-secondary)]">支持 7 种支付方式，覆盖全球 200+ 国家</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '支付通道', value: '7种', color: 'var(--brand-primary)' },
          { label: '覆盖国家', value: '200+', color: 'var(--success)' },
          { label: '平台服务费', value: '10%', color: 'var(--warning)' },
          { label: '托管资金', value: `¥${((stats?.held || 0) / 100).toFixed(0)}`, color: 'var(--info)' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="text-2xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[var(--text-muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(methods || []).map((method: any, i: number) => (
          <motion.div key={method.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="feature-card">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{method.icon}</span>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{method.name}</div>
                <div className="flex items-center gap-1.5">
                  {method.global && <span className="badge-brand text-[9px]">🌍 全球</span>}
                  <span className="text-[9px] text-[var(--text-muted)]">
                    {method.feePercent > 0 ? `手续费 ${method.feePercent}%` : '零手续费'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">{method.description}</p>
            <div className="flex flex-wrap gap-1">
              {method.currencies.map((c: string) => (
                <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-mono">{c}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Escrow Explanation */}
      <div className="glass-card p-5 border-[var(--success)]/20">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Shield size={16} className="text-[var(--success)]" /> 托管付款机制
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: '发布者付款', desc: '发布者选择支付方式，资金进入平台托管账户', color: 'var(--brand-primary)' },
            { step: '2', title: '任务执行', desc: '接单者开始工作，资金安全锁定在托管中', color: 'var(--info)' },
            { step: '3', title: '验收确认', desc: '发布者验收满意后，一键释放托管款项', color: 'var(--warning)' },
            { step: '4', title: '自动结算', desc: '接单者收到款项（扣除10%平台服务费）', color: 'var(--success)' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ background: s.color }}>
                {s.step}
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] mb-1">{s.title}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
