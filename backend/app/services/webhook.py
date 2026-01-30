"""
Webhook 서비스
HTTP Webhook 전송 로직 (일반, Slack, Discord 지원)
"""

from typing import Tuple, Union

import httpx

from app.core.config import settings


async def send_webhook(
    webhook_url: str,
    data: dict,
    return_details: bool = False,
) -> Union[bool, Tuple[bool, int, str]]:
    """
    Webhook 전송

    Args:
        webhook_url: Webhook URL
        data: 전송할 데이터
        return_details: True면 (success, status_code, message) 반환

    Returns:
        success 또는 (success, status_code, message)
    """
    max_retries = settings.WEBHOOK_MAX_RETRIES
    timeout = settings.WEBHOOK_TIMEOUT_SECONDS
    retries = 0
    last_error = ""
    last_status = 0

    async with httpx.AsyncClient() as client:
        while retries < max_retries:
            try:
                response = await client.post(
                    webhook_url,
                    json=data,
                    headers={"Content-Type": "application/json"},
                    timeout=timeout,
                )

                last_status = response.status_code

                if response.is_success:
                    if return_details:
                        return True, response.status_code, "성공"
                    return True

                last_error = f"HTTP {response.status_code}"
                retries += 1

            except httpx.TimeoutException:
                last_error = "요청 시간 초과"
                retries += 1

            except httpx.RequestError as e:
                last_error = f"요청 오류: {str(e)}"
                retries += 1

            except Exception as e:
                last_error = f"알 수 없는 오류: {str(e)}"
                retries += 1

    # 모든 재시도 실패
    if return_details:
        return False, last_status, last_error
    return False


async def send_discord_webhook(
    webhook_url: str,
    lead_data: dict,
    project_name: str = "프로젝트",
    return_details: bool = False,
) -> Union[bool, Tuple[bool, int, str]]:
    """
    Discord Webhook 전송

    Discord Webhook은 Slack과 다른 형식을 사용합니다.
    embeds를 사용하여 리치 메시지를 전송합니다.

    Args:
        webhook_url: Discord Webhook URL
        lead_data: 리드 데이터
        project_name: 프로젝트 이름
        return_details: True면 (success, status_code, message) 반환

    Returns:
        success 또는 (success, status_code, message)
    """
    # Discord embed 색상 (초록색: 성공)
    embed_color = 0x22C55E

    # 필드 구성
    fields = [
        {
            "name": "📧 이메일",
            "value": lead_data.get("email", "-"),
            "inline": True,
        },
    ]

    if lead_data.get("name"):
        fields.append({
            "name": "👤 이름",
            "value": lead_data.get("name"),
            "inline": True,
        })

    if lead_data.get("company"):
        fields.append({
            "name": "🏢 회사",
            "value": lead_data.get("company"),
            "inline": True,
        })

    if lead_data.get("role"):
        fields.append({
            "name": "💼 직무",
            "value": lead_data.get("role"),
            "inline": True,
        })


    # Discord webhook 페이로드
    discord_payload = {
        "embeds": [
            {
                "title": "🎉 새로운 리드가 수집되었습니다!",
                "description": f"**{project_name}** 프로젝트에서 새 리드가 등록되었습니다.",
                "color": embed_color,
                "fields": fields,
                "footer": {
                    "text": "FORMTION",
                },
                "timestamp": lead_data.get("created_at"),
            }
        ],
    }

    return await send_webhook(webhook_url, discord_payload, return_details)


async def send_discord_signup_notification(
    user_email: str,
    user_name: str,
) -> bool:
    """
    신규 유저 가입 시 Discord 알림 전송

    Args:
        user_email: 가입한 유저 이메일
        user_name: 가입한 유저 이름

    Returns:
        전송 성공 여부
    """
    webhook_url = settings.DISCORD_SIGNUP_WEBHOOK_URL

    if not webhook_url:
        return False

    # Discord embed 색상 (파란색: 새 가입)
    embed_color = 0x3B82F6

    discord_payload = {
        "embeds": [
            {
                "title": "🎉 새로운 유저가 가입했습니다!",
                "color": embed_color,
                "fields": [
                    {
                        "name": "👤 이름",
                        "value": user_name or "-",
                        "inline": True,
                    },
                    {
                        "name": "📧 이메일",
                        "value": user_email,
                        "inline": True,
                    },
                ],
                "footer": {
                    "text": "FORMTION",
                },
            }
        ],
    }

    return await send_webhook(webhook_url, discord_payload)
