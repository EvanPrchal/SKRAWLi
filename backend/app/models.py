from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    pass