import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Checkbox from '../ui/Checkbox'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'

interface FormConfig {
  fields: {
    email: { enabled: boolean; required: boolean }
    name: { enabled: boolean; required: boolean }
    company: { enabled: boolean; required: boolean }
    role: { enabled: boolean; required: boolean; options?: string[] }
    detail?: { enabled: boolean; required: boolean }
  }
  consent: {
    privacy: { enabled: boolean; required: boolean }
    marketing: { enabled: boolean; required: boolean }
  }
  button_label?: string
  texts?: {
    email_placeholder?: string
    name_placeholder?: string
    company_placeholder?: string
    role_placeholder?: string
    privacy_label?: string
    marketing_label?: string
    trust_text?: string
    skip_label?: string
    detail_placeholder?: string
  }
}

interface LeadFormProps {
  formConfig: FormConfig
  onSubmit: (data: any) => Promise<any>
  isSubmitting?: boolean
  compact?: boolean
  primaryColor?: string
}

export default function LeadForm({
  formConfig,
  onSubmit,
  isSubmitting = false,
  compact: _compact = false,
  primaryColor = '#FF5A1F',
}: LeadFormProps) {
  const [error, setError] = useState<string | null>(null)
  const t = formConfig.texts || {}

  // 동적 스키마 생성
  const schemaShape: any = {
    email: z.string().email('올바른 이메일을 입력해주세요.'),
  }

  if (formConfig.fields.name?.enabled && formConfig.fields.name?.required) {
    schemaShape.name = z.string().min(1, '이름을 입력해주세요.')
  } else {
    schemaShape.name = z.string().optional()
  }

  if (formConfig.fields.company?.enabled && formConfig.fields.company?.required) {
    schemaShape.company = z.string().min(1, '회사명을 입력해주세요.')
  } else {
    schemaShape.company = z.string().optional()
  }

  if (formConfig.fields.role?.enabled && formConfig.fields.role?.required) {
    schemaShape.role = z.string().min(1, '직무를 선택해주세요.')
  } else {
    schemaShape.role = z.string().optional()
  }

  if (formConfig.fields.detail?.enabled && formConfig.fields.detail?.required) {
    schemaShape.detail = z.string().min(1, '세부사항을 입력해주세요.')
  } else {
    schemaShape.detail = z.string().optional()
  }

  if (formConfig.consent.privacy?.enabled && formConfig.consent.privacy?.required) {
    schemaShape.consent_privacy = z.literal(true, {
      errorMap: () => ({ message: '개인정보 처리에 동의해주세요.' }),
    })
  } else {
    schemaShape.consent_privacy = z.boolean().default(true)
  }

  schemaShape.consent_marketing = z.boolean().default(false)

  const schema = z.object(schemaShape)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      consent_privacy: true,
      consent_marketing: false,
    },
  })

  const handleFormSubmit = async (data: any) => {
    setError(null)
    try {
      await onSubmit(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '제출 중 오류가 발생했습니다.')
    }
  }

  const roleOptions = formConfig.fields.role?.options || [
    'CEO/Founder',
    '마케팅 담당자',
    '세일즈 담당자',
    '기타',
  ]

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
      style={{
        '--project-primary': primaryColor,
      } as React.CSSProperties}
    >
      {/* 이메일 */}
      <Input
        type="email"
        placeholder={t.email_placeholder || '이메일'}
        error={errors.email?.message as string}
        required
        {...register('email')}
      />

      {/* 이름 */}
      {formConfig.fields.name?.enabled && (
        <Input
          type="text"
          placeholder={t.name_placeholder || '이름'}
          error={errors.name?.message as string}
          required={formConfig.fields.name.required}
          {...register('name')}
        />
      )}

      {/* 회사명 */}
      {formConfig.fields.company?.enabled && (
        <Input
          type="text"
          placeholder={t.company_placeholder || '회사명'}
          error={errors.company?.message as string}
          required={formConfig.fields.company.required}
          {...register('company')}
        />
      )}

      {/* 직무 */}
      {formConfig.fields.role?.enabled && (
        <Select
          options={[
            { value: '', label: t.role_placeholder || '직무 선택' },
            ...roleOptions.map((role) => ({ value: role, label: role })),
          ]}
          error={errors.role?.message as string}
          required={formConfig.fields.role.required}
          {...register('role')}
        />
      )}

      {/* 세부사항 */}
      {formConfig.fields.detail?.enabled && (
        <Textarea
          placeholder={t.detail_placeholder || '세부사항을 입력해주세요.'}
          rows={3}
          error={errors.detail?.message as string}
          required={formConfig.fields.detail.required}
          {...register('detail')}
        />
      )}

      {/* 동의 옵션 */}
      {formConfig.consent.privacy?.enabled && (
        <div>
          <Checkbox
            label={
              <span>
                {t.privacy_label || '개인정보 처리에 동의합니다.'}
                {formConfig.consent.privacy.required ? ' (필수)' : ''}
                {' '}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--project-primary)] hover:opacity-80 underline text-xs ml-1 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  자세히 보기
                </Link>
              </span>
            }
            required={formConfig.consent.privacy.required}
            error={errors.consent_privacy?.message as string}
            {...register('consent_privacy')}
          />
        </div>
      )}

      {formConfig.consent.marketing?.enabled && (
        <div>
          <Checkbox
            label={
              <span>
                {t.marketing_label || '업데이트/새 템플릿 소식을 받아볼래요.'} (선택)
                {' '}
                <Link
                  to="/marketing-consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--project-primary)] hover:opacity-80 underline text-xs ml-1 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  자세히 보기
                </Link>
              </span>
            }
            {...register('consent_marketing')}
          />
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
      >
        {formConfig.button_label || 'Unlock'}
      </Button>

      {/* 안내 문구 - 신뢰 문구 */}
      {(t.trust_text !== '' ) && (
        <p className="text-xs text-text-muted text-center">
          {t.trust_text || '스팸 없음 · 한 번만 입력 · 재방문시 자동 열림'}
        </p>
      )}
    </form>
  )
}


