from fastapi import APIRouter

from app.api.routes import logs, assets, liability, dashboard, investments, common, inflows, outflows, login, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(dashboard.router)
api_router.include_router(inflows.router)
api_router.include_router(outflows.router)
api_router.include_router(investments.router)
api_router.include_router(assets.router)
api_router.include_router(liability.router)
api_router.include_router(common.router)
api_router.include_router(logs.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
