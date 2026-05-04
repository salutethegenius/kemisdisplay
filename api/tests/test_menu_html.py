import unittest
from types import SimpleNamespace

from pydantic import ValidationError

from app.schemas import MENU_MAX_ITEMS, MenuCreate, MenuItemIn, MenuSectionIn, MenuUpdate
from app.services.menu_html import (
    _chalkboard_density_class,
    build_chalkboard_html,
    resolve_chalkboard_grid,
)


class ResolveChalkboardGridTests(unittest.TestCase):
    def test_specials_sides_more_reorders_to_quadrants(self) -> None:
        specials = {"heading": "SPECIALS", "items": [{"name": "A", "price": "1"}]}
        sides = {"heading": "SIDES", "items": [{"name": "Rice", "price": ""}]}
        more = {"heading": "MORE SPECIALS", "items": [{"name": "M", "price": "2"}]}
        sections = [specials, sides, more]
        cells, mode = resolve_chalkboard_grid(sections)
        self.assertEqual(mode, "quadrants4")
        self.assertEqual(len(cells), 4)
        self.assertIs(cells[0], specials)
        self.assertIs(cells[1], more)
        self.assertIsNone(cells[2])
        self.assertIs(cells[3], sides)

    def test_linear_without_more_specials(self) -> None:
        sections = [
            {"heading": "SPECIALS", "items": []},
            {"heading": "SIDES", "items": []},
        ]
        cells, mode = resolve_chalkboard_grid(sections)
        self.assertEqual(mode, "linear")
        self.assertEqual(cells, sections)

    def test_linear_when_too_many_other_sections(self) -> None:
        sides = {"heading": "SIDES", "items": []}
        more = {"heading": "MORE SPECIALS", "items": []}
        a = {"heading": "A", "items": []}
        b = {"heading": "B", "items": []}
        c = {"heading": "C", "items": []}
        sections = [a, b, c, sides, more]
        cells, mode = resolve_chalkboard_grid(sections)
        self.assertEqual(mode, "linear")
        self.assertEqual(cells, sections)


class ChalkboardDensityTests(unittest.TestCase):
    def test_density_tiers(self) -> None:
        self.assertEqual(_chalkboard_density_class(7), "")
        self.assertEqual(_chalkboard_density_class(8), "board--dense")
        self.assertEqual(_chalkboard_density_class(11), "board--xdense")


class BuildChalkboardHtmlTests(unittest.TestCase):
    def test_html_contains_quadrant_order(self) -> None:
        menu = SimpleNamespace(
            title="TODAY",
            footer_note="555-1212",
            sections=[
                {"heading": "SPECIALS", "items": [{"name": "Wings", "price": "12"}]},
                {"heading": "SIDES", "items": [{"name": "Rice", "price": ""}]},
                {"heading": "MORE SPECIALS", "items": [{"name": "Ribs", "price": "16"}]},
            ],
        )
        html = build_chalkboard_html(menu)
        w = html.index("Wings")
        r = html.index("Ribs")
        rice = html.index("Rice")
        self.assertLess(w, r)
        self.assertLess(r, rice)


class MenuCreateItemCapTests(unittest.TestCase):
    def test_rejects_over_max_items(self) -> None:
        items = [MenuItemIn(name=f"n{i}", price="1") for i in range(MENU_MAX_ITEMS + 1)]
        with self.assertRaises(ValidationError):
            MenuCreate(
                title="M",
                sections=[MenuSectionIn(heading="S", items=items)],
            )

    def test_allows_exactly_max(self) -> None:
        items = [MenuItemIn(name=f"n{i}", price="1") for i in range(MENU_MAX_ITEMS)]
        m = MenuCreate(
            title="M",
            sections=[MenuSectionIn(heading="S", items=items)],
        )
        self.assertEqual(sum(len(s.items) for s in m.sections), MENU_MAX_ITEMS)

    def test_menu_update_rejects_over_cap(self) -> None:
        items = [MenuItemIn(name=f"n{i}", price="1") for i in range(MENU_MAX_ITEMS + 1)]
        with self.assertRaises(ValidationError):
            MenuUpdate(sections=[MenuSectionIn(heading="S", items=items)])


if __name__ == "__main__":
    unittest.main()
