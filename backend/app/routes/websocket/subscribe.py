from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from starlette import status

from app.auth.dependencies import get_websocket_user
from app.routes.project import check_user_project_access
from app.sqla.database import get_db
from app.utils.config import allow_origins
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
    origin = websocket.headers.get("origin")
    if origin not in allow_origins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin not allowed"
        )

    watcher = await get_websocket_user(websocket, db)
    if not watcher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

    if watcher.id == watched_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot subscribe to self"
        )

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
