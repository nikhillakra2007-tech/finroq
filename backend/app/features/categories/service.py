from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Category, CategoryType
from app.shared.schemas import CategoryCreate, CategoryResponse


class CategoryService:
    def __init__(self, db: AsyncSession, owner_id: str):
        self.db = db
        self.owner_id = owner_id

    async def create(self, data: CategoryCreate) -> CategoryResponse:
        category = Category(
            name=data.name,
            category_type=data.category_type,
            owner_id=self.owner_id,
            is_system=False,
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return CategoryResponse.model_validate(category)

    async def list(
        self,
        category_type: Optional[CategoryType] = None,
        include_system: bool = True,
    ) -> List[CategoryResponse]:
        conditions = [
            or_(Category.owner_id == self.owner_id, Category.is_system == True)
        ]
        if not include_system:
            conditions.append(Category.is_system == False)
        if category_type:
            conditions.append(Category.category_type == category_type)

        query = select(Category).where(and_(*conditions)).order_by(Category.name)
        result = await self.db.execute(query)
        categories = result.scalars().all()

        return [CategoryResponse.model_validate(c) for c in categories]

    async def get_by_id(self, category_id: int) -> Optional[CategoryResponse]:
        result = await self.db.execute(
            select(Category).where(
                and_(
                    Category.id == category_id,
                    or_(Category.owner_id == self.owner_id, Category.is_system == True),
                )
            )
        )
        category = result.scalar_one_or_none()
        if not category:
            return None
        return CategoryResponse.model_validate(category)

    async def seed_defaults(self) -> List[CategoryResponse]:
        default_categories = [
            # Income categories
            ("Salary", CategoryType.INCOME),
            ("Freelance", CategoryType.INCOME),
            ("Investments", CategoryType.INCOME),
            ("Gifts", CategoryType.INCOME),
            ("Other Income", CategoryType.INCOME),
            # Expense categories
            ("Housing", CategoryType.EXPENSE),
            ("Transportation", CategoryType.EXPENSE),
            ("Food", CategoryType.EXPENSE),
            ("Utilities", CategoryType.EXPENSE),
            ("Healthcare", CategoryType.EXPENSE),
            ("Entertainment", CategoryType.EXPENSE),
            ("Shopping", CategoryType.EXPENSE),
            ("Education", CategoryType.EXPENSE),
            ("Personal Care", CategoryType.EXPENSE),
            ("Other Expenses", CategoryType.EXPENSE),
        ]

        created = []
        for name, cat_type in default_categories:
            existing = await self.db.execute(
                select(Category).where(
                    and_(
                        Category.name == name,
                        Category.category_type == cat_type,
                        Category.is_system == True,
                    )
                )
            )
            if existing.scalar_one_or_none():
                continue

            category = Category(
                name=name,
                category_type=cat_type,
                owner_id=None,
                is_system=True,
            )
            self.db.add(category)
            created.append(category)

        if created:
            await self.db.commit()
            for c in created:
                await self.db.refresh(c)

        return [CategoryResponse.model_validate(c) for c in created]