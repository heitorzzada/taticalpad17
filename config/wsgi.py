"""
WSGI config for TacticalPad Futsal Pro.
Exporta 'application' e 'app' para compatibilidade total com Vercel e Gunicorn.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
app = application
