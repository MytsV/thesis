from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session

from app.auth.dependencies import websocket_auth_required
from app.routes.project import check_user_project_access
from app.sqla.database import get_db
from app.websocket.logging import logger
from app.websocket.subscription_manager import subscription_manager

router = APIRouter()


@router.websocket(
    "/ws/projects/{project_id}/views/{view_id}/users/{watched_user_id}/subscribe"
)
async def filter_sort_subscription(
    websocket: WebSocket,
    project_id: UUID,
    watched_user_id: int,
    view_id: str,
    db: Session = Depends(get_db),
):
    watcher = await websocket_auth_required(websocket, db)
    if not watcher:
        await websocket.close(code=1008, reason="Authentication failed")
        return

    try:
        check_user_project_access(db, project_id, watcher.id)
        check_user_project_access(db, project_id, watched_user_id)

        connected = await subscription_manager.connect_subscription(
            websocket, project_id, watcher.id, watched_user_id, view_id
        )

        if not connected:
            return

        try:
            while True:
                data = await websocket.receive_text()

        except WebSocketDisconnect:
            pass

    except HTTPException as e:
        logger.warning(f"Access denied for subscription: {e.detail}")
        await websocket.close(code=1008, reason=e.detail)

    except Exception as e:
        logger.error(f"Error in subscription app.websocket: {str(e)}")
        await websocket.close(code=1011, reason="Server error")

    finally:
        await subscription_manager.disconnect_subscription(
            project_id, watcher.id, watched_user_id, view_id
        )
