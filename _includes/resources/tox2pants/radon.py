"""Plugin for Radon."""
from pants.backend.adhoc.code_quality_tool import CodeQualityToolRuleBuilder


def rules():
    """Plugin stub to create rules for Radon."""
    cfg = CodeQualityToolRuleBuilder(
        goal="lint", target="//devtools:radon_cc", name="Radon CC", scope="radon_cc"
    )
    return cfg.rules()
