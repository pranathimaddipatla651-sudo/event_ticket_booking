from pydantic import BaseModel, Field


class Item(BaseModel):
    ticket_type_id: int
    quantity: int = Field(gt=0)


def book(cur, user_id, items):
    raise NotImplementedError("book() is not written yet")