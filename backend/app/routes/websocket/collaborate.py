import json
import uuid
from uuid import UUID

import redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from starlette import status

from app.auth.dependencies import get_websocket_user
from app.redis.models import (
    InitEvent,
)
from app.redis.storage import get_redis
from app.redis.users import (
    get_active_users,
)
from app.routes.project import check_user_project_access
from app.sqla.database import get_db
from app.utils.config import allow_origins
from app.websocket.collaboration_manager import collaboration_manager
from app.websocket.logging import logger
from app.websocket.message_handlers import CollaborationMessageHandler

router = APIRouter()


@router.websocket("/ws/projects/{project_id}/collaborate")
async def collaborate(
    websocket: WebSocket,
    project_id: UUID,
    db: Session = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    origin = websocket.headers.get("origin")
    if origin not in allow_origins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin not allowed"
        )

    user = await get_websocket_user(websocket, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

    connection_id = str(uuid.uuid4())

    try:
        # Verify project access
        check_user_project_access(db, project_id, user.id)

        # Connect to collaboration manager
        await collaboration_manager.connect(websocket, project_id, user, connection_id)

        # Send initial state
        active_users = await get_active_users(redis_client, str(project_id))
        init_event = InitEvent(users=active_users)
        await websocket.send_text(init_event.model_dump_json())

        message_handler = CollaborationMessageHandler(
            websocket=websocket,
            project_id=project_id,
            user=user,
            redis_client=redis_client,
            db=db,
        )

        # Main message loop
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    await message_handler.handle_message(message)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from user {user.id}")

        except WebSocketDisconnect:
            # Handle normal disconnection
            pass

    except HTTPException as e:
        logger.warning(
            f"Access denied for user {user.id} to project {project_id}: {e.detail}"
        )
        await websocket.close(code=1008, reason=e.detail)

    except Exception as e:
        logger.error(f"Error in collaboration app.websocket: {str(e)}")
        await websocket.close(code=1011, reason="Server error")

    finally:
        await collaboration_manager.disconnect(project_id, user.id, connection_id)
