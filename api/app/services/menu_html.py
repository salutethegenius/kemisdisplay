"""Chalkboard-style HTML for menu preview and video capture."""

from jinja2 import BaseLoader, Environment

from app.models import Menu

_CHALKBOARD = """<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0a0a0a; }
  .frame {
    width: 1920px; height: 1080px;
    background: radial-gradient(ellipse at 30% 20%, #1a1510 0%, #0d0d0d 55%, #050505 100%);
    position: relative;
    overflow: hidden;
  }
  .board {
    position: absolute; inset: 48px 72px;
    background: linear-gradient(165deg, #141414 0%, #0e0e0e 40%, #121212 100%);
    border: 4px solid #2a2a2a;
    border-radius: 8px;
    box-shadow: inset 0 0 120px rgba(0,0,0,0.65), 0 24px 80px rgba(0,0,0,0.5);
    overflow: hidden;
  }
  .inner {
    position: absolute; left: 64px; right: 64px; top: 48px; bottom: 48px;
    animation: scrollBoard 30s linear infinite;
  }
  @keyframes scrollBoard {
    0% { transform: translateY(0); }
    100% { transform: translateY(-12%); }
  }
  h1 {
    font-family: 'Caveat', cursive;
    font-size: 72px;
    color: #f5e6a8;
    text-align: center;
    text-decoration: underline;
    text-underline-offset: 12px;
    margin-bottom: 40px;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.4);
  }
  .section { margin-bottom: 36px; }
  .section h2 {
    font-family: 'Caveat', cursive;
    font-size: 48px;
    color: #e8d48b;
    margin-bottom: 16px;
    border-bottom: 2px dashed rgba(245,230,168,0.25);
    padding-bottom: 8px;
  }
  .row {
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: 'Caveat', cursive;
    font-size: 38px;
    color: #f0ead8;
    padding: 10px 0;
    border-bottom: 1px dotted rgba(240,234,216,0.12);
  }
  .row .name { flex: 1; }
  .row .price { font-weight: 700; color: #fff8dc; min-width: 120px; text-align: right; }
  .footer {
    margin-top: 48px;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 28px;
    color: rgba(245,230,168,0.75);
  }
</style></head><body>
<div class="frame"><div class="board"><div class="inner">
  <h1>{{ title }}</h1>
  {% for sec in sections %}
  <div class="section">
    <h2>{{ sec.heading }}</h2>
    {% for it in sec["items"] %}
    <div class="row"><span class="name">{{ it.name }}</span><span class="price">{{ it.price | menu_price }}</span></div>
    {% endfor %}
  </div>
  {% endfor %}
  {% if footer_note %}
  <div class="footer">{{ footer_note }}</div>
  {% endif %}
</div></div></div>
</body></html>
"""


def _sections_for_template(raw: object) -> list[dict]:
    """Coerce DB JSON into shape the Jinja template expects (avoids missing 'items')."""
    if not isinstance(raw, list):
        return []
    out: list[dict] = []
    for sec in raw:
        if not isinstance(sec, dict):
            continue
        heading = str(sec.get("heading", "") or "").strip() or "Section"
        items_raw = sec.get("items")
        if not isinstance(items_raw, list):
            items_raw = []
        items_norm: list[dict] = []
        for it in items_raw:
            if isinstance(it, dict):
                items_norm.append(
                    {
                        "name": str(it.get("name", "") or ""),
                        "price": str(it.get("price", "") or ""),
                    }
                )
            else:
                items_norm.append({"name": "", "price": ""})
        out.append({"heading": heading, "items": items_norm})
    return out


def _menu_price(value: object) -> str:
    """Show USD-style prices: prepend $ when missing (never double-prefix)."""
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    if s.startswith("$"):
        return s
    return f"${s}"


def build_chalkboard_html(menu: Menu) -> str:
    env = Environment(loader=BaseLoader(), autoescape=True)
    env.filters["menu_price"] = _menu_price
    t = env.from_string(_CHALKBOARD)
    sections = _sections_for_template(menu.sections)
    return t.render(
        title=menu.title or "SPECIALS",
        sections=sections,
        footer_note=menu.footer_note or "",
    )
