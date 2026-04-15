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
    position: absolute; inset: 40px 56px;
    background: linear-gradient(165deg, #141414 0%, #0e0e0e 40%, #121212 100%);
    border: 4px solid #2a2a2a;
    border-radius: 8px;
    box-shadow: inset 0 0 120px rgba(0,0,0,0.65), 0 24px 80px rgba(0,0,0,0.5);
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  h1 {
    font-family: 'Caveat', cursive;
    font-size: 64px;
    color: #f5e6a8;
    text-align: center;
    text-decoration: underline;
    text-underline-offset: 10px;
    padding: 32px 0 24px;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.4);
    flex-shrink: 0;
  }
  .grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0;
    padding: 0 48px;
    min-height: 0;
  }
  .grid.cols-1 { grid-template-columns: 1fr; }
  .quadrant {
    padding: 16px 24px;
    overflow: hidden;
  }
  /* Subtle divider lines between quadrants */
  .quadrant:nth-child(odd) { border-right: 1px solid rgba(245,230,168,0.1); }
  .quadrant:nth-child(-n+2) { border-bottom: 1px solid rgba(245,230,168,0.1); }
  .quadrant h2 {
    font-family: 'Caveat', cursive;
    font-size: 40px;
    color: #e8d48b;
    margin-bottom: 12px;
    border-bottom: 2px dashed rgba(245,230,168,0.25);
    padding-bottom: 6px;
  }
  .row {
    display: flex; align-items: baseline;
    font-family: 'Caveat', cursive;
    font-size: 34px;
    color: #f0ead8;
    padding: 6px 0;
    line-height: 1.2;
  }
  .row .name { white-space: nowrap; }
  .row .dots {
    flex: 1;
    border-bottom: 2px dotted rgba(240,234,216,0.25);
    margin: 0 8px;
    min-width: 20px;
    align-self: baseline;
    position: relative;
    top: -6px;
  }
  .row .price {
    font-weight: 700;
    color: #fff8dc;
    white-space: nowrap;
  }
  .footer {
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 26px;
    color: rgba(245,230,168,0.75);
    padding: 16px 0 24px;
    flex-shrink: 0;
  }
</style></head><body>
<div class="frame"><div class="board">
  <h1>{{ title }}</h1>
  <div class="grid{% if sections | length <= 1 %} cols-1{% endif %}">
    {% for sec in sections %}
    <div class="quadrant">
      <h2>{{ sec.heading }}</h2>
      {% for it in sec["items"] %}
      <div class="row">
        <span class="name">{{ it.name }}</span>
        <span class="dots"></span>
        <span class="price">{{ it.price | menu_price }}</span>
      </div>
      {% endfor %}
    </div>
    {% endfor %}
  </div>
  {% if footer_note %}
  <div class="footer">{{ footer_note }}</div>
  {% endif %}
</div></div>
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
