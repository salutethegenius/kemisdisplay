"""Chalkboard-style HTML for menu preview and video capture."""

from __future__ import annotations

from typing import Literal

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
  .board--dense h1 { font-size: 56px; padding: 28px 0 18px; }
  .board--xdense h1 { font-size: 50px; padding: 22px 0 14px; }
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
  .quadrant--empty { padding: 16px 24px; }
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
  .board--dense .quadrant h2 { font-size: 34px; margin-bottom: 8px; padding-bottom: 4px; }
  .board--xdense .quadrant h2 { font-size: 28px; margin-bottom: 6px; padding-bottom: 3px; }
  .row {
    display: flex; align-items: baseline;
    font-family: 'Caveat', cursive;
    font-size: 34px;
    color: #f0ead8;
    padding: 6px 0;
    line-height: 1.2;
  }
  .board--dense .row { font-size: 28px; padding: 4px 0; line-height: 1.15; }
  .board--xdense .row { font-size: 24px; padding: 3px 0; line-height: 1.12; }
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
  .board--dense .row .dots { top: -4px; }
  .board--xdense .row .dots { top: -3px; }
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
  .board--dense .footer { font-size: 22px; padding: 12px 0 18px; }
  .board--xdense .footer { font-size: 20px; padding: 10px 0 16px; }
</style></head><body>
<div class="frame"><div class="board{{ ' ' + board_density_class if board_density_class else '' }}">
  <h1>{{ title }}</h1>
  <div class="grid{% if grid_mode == 'linear' and (grid_cells | length) <= 1 %} cols-1{% endif %}">
    {% for sec in grid_cells %}
    <div class="quadrant{% if grid_mode == 'quadrants4' and not sec %} quadrant--empty{% endif %}">
      {% if sec %}
      <h2>{{ sec.heading }}</h2>
      {% for it in sec["items"] %}
      <div class="row">
        <span class="name">{{ it.name }}</span>
        <span class="dots"></span>
        <span class="price">{{ it.price | menu_price }}</span>
      </div>
      {% endfor %}
      {% endif %}
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


def _is_sides_heading(heading: str) -> bool:
    return heading.strip().lower() == "sides"


def _is_more_specials_heading(heading: str) -> bool:
    """Match MORE SPECIALS without treating the main SPECIALS block as a match."""
    h = heading.strip().lower()
    if h == "more specials":
        return True
    if h == "specials":
        return False
    return "more" in h and "special" in h


def resolve_chalkboard_grid(
    sections: list[dict],
) -> tuple[list[dict] | list[dict | None], Literal["linear", "quadrants4"]]:
    """Row-major section order, except SIDES + MORE SPECIALS → TL/other, TR/more, BL/other, BR/sides."""
    if not sections:
        return [], "linear"

    sides_sec: dict | None = None
    more_sec: dict | None = None
    others: list[dict] = []
    for sec in sections:
        h = str(sec.get("heading", "") or "")
        if _is_sides_heading(h):
            sides_sec = sec
        elif _is_more_specials_heading(h):
            more_sec = sec
        else:
            others.append(sec)

    if sides_sec is None or more_sec is None:
        return (sections, "linear")
    if len(others) > 2:
        return (sections, "linear")

    tl = others[0] if len(others) >= 1 else None
    bl = others[1] if len(others) >= 2 else None
    cells: list[dict | None] = [tl, more_sec, bl, sides_sec]
    return (cells, "quadrants4")


def _max_items_in_grid_cells(
    cells: list[dict] | list[dict | None],
    mode: Literal["linear", "quadrants4"],
) -> int:
    if mode == "quadrants4":
        return max((len(s["items"]) for s in cells if s), default=0)
    return max((len(s["items"]) for s in cells), default=0)


def _chalkboard_density_class(max_items_in_busiest_cell: int) -> str:
    if max_items_in_busiest_cell >= 11:
        return "board--xdense"
    if max_items_in_busiest_cell >= 8:
        return "board--dense"
    return ""


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
    grid_cells, grid_mode = resolve_chalkboard_grid(sections)
    max_items = _max_items_in_grid_cells(grid_cells, grid_mode)
    board_density_class = _chalkboard_density_class(max_items)
    return t.render(
        title=menu.title or "SPECIALS",
        grid_mode=grid_mode,
        grid_cells=grid_cells,
        board_density_class=board_density_class,
        footer_note=menu.footer_note or "",
    )
