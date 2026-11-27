#!/usr/bin/env python3
"""把两份 backtest 报告文本合并成并排对比表（Markdown）。

用法: python3 scripts/compare-reports.py report-donchian.txt report-donchian-plan.txt
"""
import re
import sys

SECTIONS = ["全部交易", "样本内", "样本外"]


def parse_metrics(text):
    """返回 {section: {metric: value}}，section 取 全部交易/样本内/样本外。"""
    out = {}
    blocks = re.split(r"\n## ", text)
    for block in blocks:
        title = block.split("\n", 1)[0].strip()
        for section in SECTIONS:
            if title.startswith(section):
                rows = {}
                for line in block.splitlines():
                    m = re.match(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
                    if not m:
                        continue
                    key, value = m.group(1).strip(), m.group(2).strip()
                    if key in ("指标", "---") or value in ("---",):
                        continue
                    if key.startswith(":"):
                        continue
                    rows[key] = value
                out[section] = rows
    return out


def parse_filters(text):
    """解析 --compare 的过滤器表格：{section: {filter: [通过, 不通过, 保留比例, 差值, t]}}"""
    out = {}
    parts = re.split(r"\n### ", text)
    for part in parts:
        title = part.split("\n", 1)[0].strip()
        if title not in SECTIONS:
            continue
        rows = {}
        for line in part.splitlines():
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) < 6 or cells[0] in ("过滤器", ""):
                continue
            if set(cells[0]) <= set("-: "):
                continue
            rows[cells[0]] = cells[1:6]
        if rows:
            out.setdefault(title, {}).update(rows)
    return out


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    texts = [open(p, encoding="utf-8").read() for p in sys.argv[1:3]]
    names = ["donchian", "donchian-plan"]
    parsed = [parse_metrics(t) for t in texts]
    filters = [parse_filters(t) for t in texts]

    print("## 核心指标对比\n")
    metrics = [
        "交易数",
        "胜率",
        "平均 R（期望值）",
        "R 中位数",
        "累计 R",
        "盈亏比（R）",
        "最长连亏",
        "最大回撤（R，近似）",
        "平均持有K线数",
    ]
    for section in SECTIONS:
        print(f"### {section}\n")
        print(f"| 指标 | {names[0]} | {names[1]} | 差异 |")
        print("|---|---|---|---|")
        for metric in metrics:
            a = parsed[0].get(section, {}).get(metric, "-")
            b = parsed[1].get(section, {}).get(metric, "-")
            diff = "-"
            try:
                fa, fb = float(a), float(b)
                diff = f"{fb - fa:+.2f}"
            except ValueError:
                pass
            print(f"| {metric} | {a} | {b} | {diff} |")
        print()

    print("## 过滤器对比（拆分基准交易）\n")
    for section in SECTIONS:
        f0 = filters[0].get(section, {})
        f1 = filters[1].get(section, {})
        if not f0 and not f1:
            continue
        print(f"### {section}\n")
        print("| 过滤器 | 模式 | 通过/不通过 | 保留比例 | 通过组平均 R | 不通过组平均 R | 差值 | t 值 |")
        print("|---|---|---|---|---|---|---|---|")
        for name in dict.fromkeys(list(f0) + list(f1)):
            for label, table in ((names[0], f0), (names[1], f1)):
                cells = table.get(name)
                if not cells:
                    continue
                passed, retained, avg_pass, avg_fail, diff = (cells + ["-"] * 5)[:5]
                t = cells[5] if len(cells) > 5 else "-"
                print(f"| {name} | {label} | {passed} | {retained} | {avg_pass} | {avg_fail} | {diff} | {t} |")
        print()


if __name__ == "__main__":
    main()
