import Input from '../ui/Input'
import Switch from '../ui/Switch'

interface UXConfig {
  top_form: { enabled: boolean; title: string; subtitle: string }
  bottom_form: { enabled: boolean; title: string; subtitle: string }
  entry_modal: { enabled: boolean; title: string; subtitle: string; allow_close: boolean; delay_seconds: number }
  floating_cta: { enabled: boolean; label: string; mobile_bottom_fixed: boolean; modal_title?: string; modal_subtitle?: string }
  inline_blur_gate: { enabled: boolean; title: string; subtitle: string }
}

interface UXConfigSectionProps {
  uxConfig: UXConfig
  onUpdate: (updates: Partial<UXConfig>) => void
}

export default function UXConfigSection({ uxConfig, onUpdate }: UXConfigSectionProps) {
  const updateTopForm = (updates: Partial<UXConfig['top_form']>) => {
    onUpdate({
      top_form: { ...uxConfig.top_form, ...updates }
    })
  }

  const updateBottomForm = (updates: Partial<UXConfig['bottom_form']>) => {
    onUpdate({
      bottom_form: { ...uxConfig.bottom_form, ...updates }
    })
  }

  const updateFloatingCta = (updates: Partial<UXConfig['floating_cta']>) => {
    onUpdate({
      floating_cta: { ...uxConfig.floating_cta, ...updates }
    })
  }

  const updateEntryModal = (updates: Partial<UXConfig['entry_modal']>) => {
    onUpdate({
      entry_modal: { ...uxConfig.entry_modal, ...updates }
    })
  }

  return (
    <div className="space-y-6">
      {/* 상단/하단 폼 통합 설정 */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-text-primary">상단/하단 폼</h4>
            <p className="text-sm text-text-muted">문서처럼 자연스럽게</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                label="상단"
                checked={uxConfig.top_form?.enabled ?? false}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  updateTopForm({
                    enabled,
                    title: uxConfig.top_form?.title || uxConfig.bottom_form?.title || '계속 보기 전에, 10초만.',
                    subtitle: uxConfig.top_form?.subtitle || uxConfig.bottom_form?.subtitle || '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.'
                  });
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                label="하단"
                checked={uxConfig.bottom_form?.enabled ?? false}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  updateBottomForm({
                    enabled,
                    title: uxConfig.bottom_form?.title || uxConfig.top_form?.title || '계속 보기 전에, 10초만.',
                    subtitle: uxConfig.bottom_form?.subtitle || uxConfig.top_form?.subtitle || '한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요.'
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* 공통 설정 (상단 또는 하단 폼이 활성화되어 있을 때만) */}
        {(uxConfig.top_form?.enabled || uxConfig.bottom_form?.enabled) && (
          <div className="space-y-3 pl-3 border-l-2 border-primary-200">
            <Input
              label="제목"
              value={uxConfig.top_form?.title || uxConfig.bottom_form?.title || ''}
              onChange={(e) => {
                const title = e.target.value;
                // 항상 둘 다 업데이트 (동기화 유지)
                updateTopForm({ title });
                updateBottomForm({ title });
              }}
            />
            <Input
              label="부제목"
              value={uxConfig.top_form?.subtitle || uxConfig.bottom_form?.subtitle || ''}
              onChange={(e) => {
                const subtitle = e.target.value;
                // 항상 둘 다 업데이트 (동기화 유지)
                updateTopForm({ subtitle });
                updateBottomForm({ subtitle });
              }}
            />
          </div>
        )}
      </div>

      {/* Floating CTA */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <Switch
          label="플로팅 CTA"
          description="방해 없이 최소한으로"
          checked={uxConfig.floating_cta.enabled}
          onChange={(e) => updateFloatingCta({ enabled: e.target.checked })}
        />
        {uxConfig.floating_cta.enabled && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary-200">
            <Input
              label="버튼 라벨"
              value={uxConfig.floating_cta.label}
              onChange={(e) => updateFloatingCta({ label: e.target.value })}
            />
            <Input
              label="모달 제목"
              placeholder="계속 보기 전에, 10초만."
              value={uxConfig.floating_cta.modal_title || ''}
              onChange={(e) => updateFloatingCta({ modal_title: e.target.value })}
            />
            <Input
              label="모달 부제목"
              placeholder="한 번만 입력하면 바로 전체가 열려요. 다음부터는 자동이에요."
              value={uxConfig.floating_cta.modal_subtitle || ''}
              onChange={(e) => updateFloatingCta({ modal_subtitle: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <Switch
          label="진입 모달"
          description="시작부터 확실하게"
          checked={uxConfig.entry_modal.enabled}
          onChange={(e) => updateEntryModal({ enabled: e.target.checked })}
        />
        {uxConfig.entry_modal.enabled && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-primary-200">
            <Input
              label="제목"
              value={uxConfig.entry_modal.title}
              onChange={(e) => updateEntryModal({ title: e.target.value })}
            />
            <Input
              label="부제목"
              value={uxConfig.entry_modal.subtitle}
              onChange={(e) => updateEntryModal({ subtitle: e.target.value })}
            />
            <Input
              label="지연 시간 (초)"
              type="number"
              min="0"
              max="60"
              placeholder="0"
              value={uxConfig.entry_modal.delay_seconds?.toString() || '0'}
              onChange={(e) => updateEntryModal({ delay_seconds: parseInt(e.target.value) || 0 })}
              helperText="페이지 진입 후 모달이 표시될 때까지의 대기 시간"
            />
            <Switch
              label="닫기 버튼 표시"
              checked={uxConfig.entry_modal.allow_close}
              onChange={(e) => updateEntryModal({ allow_close: e.target.checked })}
            />
          </div>
        )}
      </div>

      {/* 경고 메시지 */}
      {!uxConfig.top_form?.enabled && !uxConfig.bottom_form?.enabled && !uxConfig.floating_cta?.enabled && !uxConfig.entry_modal?.enabled && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          ⚠️ 최소 하나 이상의 폼 방식을 선택해주세요.
        </div>
      )}
    </div>
  )
}