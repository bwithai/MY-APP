import calendar
from datetime import timedelta, datetime, date
from decimal import Decimal
from typing import Any, Dict

from fastapi import APIRouter, Query
from sqlmodel import func, select
from sqlalchemy.sql import expression

from app.api.deps import CurrentUser, SessionDep
from app.cf_models.schemas import CommandFunds, Expenses, Balances, Investments, Liabilities
from app.utils import get_year_range, get_month_range, divide_into_weeks

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def format_yearly_data(session, current_user, year: int, user_id) -> Dict[int, Dict[str, Any]]:
    monthly_data = {}
    days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for month in range(1, 13):  # Iterate over all months of the year
        start_date, end_date = get_month_range(year, month)  # Get the month's date range
        week_data = {}
        weekly_labels = []
        weekly_inflow = []
        weekly_outflow = []
        weekly_invest = []
        weekly_liability = []

        # Divide the month into weekly ranges
        for week_index, (week_start, week_end) in enumerate(divide_into_weeks(start_date, end_date), start=1):
            # Fetch balance data for the week
            weekly_balance = get_balance_data(session, current_user, week_start, week_end, user_id)

            weekly_inflow.append(weekly_balance.get("inflow", 0))
            weekly_outflow.append(weekly_balance.get("outflow", 0))
            weekly_invest.append(weekly_balance.get("investment", 0))
            weekly_liability.append(weekly_balance.get("liability", 0))

            # Fetch daily data for the week
            daily_inflow = []
            daily_outflow = []
            daily_invest = []
            daily_liability = []
            daily_labels = []  # To store the actual day names for this week

            for day in range((week_end - week_start).days + 1):
                day_date = week_start + timedelta(days=day)
                daily_labels.append(days_of_week[day_date.weekday()])  # Get the day's name
                # Fetch balance data for the specific day
                daily_balance = get_balance_data(session, current_user, day_date, day_date, user_id)
                daily_inflow.append(daily_balance.get("inflow", 0))
                daily_outflow.append(daily_balance.get("outflow", 0))
                daily_invest.append(daily_balance.get("investment", 0))
                daily_liability.append(daily_balance.get("liability", 0))

            # Adjust the day names for the last week if it's a partial week
            if week_end.month != week_start.month or (week_end - week_start).days < 6:
                days_present = [
                    days_of_week[(week_start + timedelta(days=offset)).weekday()]
                    for offset in range((week_end - week_start).days + 1)
                ]
            else:
                days_present = days_of_week

            # Store week data
            week_data[week_index] = {
                "days": days_present,
                "inflow": daily_inflow,
                "outflow": daily_outflow,
                "investment": daily_invest,
                "liability": daily_liability
            }
            weekly_labels.append(f"Week {week_index}")

        # Fetch monthly balance data
        monthly_balance = get_balance_data(session, current_user, start_date, end_date, user_id)

        # Check if any financial data exists for the month
        has_data = any([
            monthly_balance["inflow"],
            monthly_balance["outflow"],
            monthly_balance["investment"],
            monthly_balance["liability"]
        ])

        if has_data:
            monthly_data[calendar.month_name[month]] = {
                "weeklyLabels": weekly_labels,
                "inflow": weekly_inflow,
                "investment": weekly_invest,
                "liability": weekly_liability,
                "outflow": weekly_outflow,
                "weekData": week_data,
            }

    return {year: monthly_data}


def format_weekly_data(session, current_user, month, year):
    # Initialize the result for weekly data
    week_data = {}

    # Get the first day of the given month and year
    first_day_of_month = f"{year}-{month:02d}-01"
    first_day_of_month = datetime.strptime(first_day_of_month, "%Y-%m-%d")

    # Get the number of days in the month
    _, num_days_in_month = calendar.monthrange(year, month)

    # Define days of the week
    days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    # Iterate through the 4 weeks of the month
    for week_number in range(1, 5):
        week_start_date = first_day_of_month + timedelta(weeks=week_number - 1)

        # Ensure the start of the week falls within the month
        if week_start_date.month != month:
            break  # No more weeks in the month

        week_end_date = week_start_date + timedelta(days=6)  # 7 days in a week
        if week_end_date.month != month:
            week_end_date = first_day_of_month.replace(day=num_days_in_month)

        # Fetch inflow and outflow data for each day in the week
        inflow_data = []
        outflow_data = []
        week_days = []

        # Iterate through the 7 days of the week
        for i in range(7):
            current_day = week_start_date + timedelta(days=i)
            if current_day.month != month:
                break  # Skip days outside the current month

            week_days.append(days_of_week[current_day.weekday()])

            # Fetch the daily data (assuming you have a function to fetch daily inflow/outflow)
            data = get_balance_data(session, current_user, current_day, current_day)
            inflow_data.append(data["inflow"])
            outflow_data.append(data["outflow"])

        # Store the result for the week
        week_data[week_number] = {
            "days": week_days,
            "inflow": inflow_data,
            "outflow": outflow_data
        }

    return {"month": month, "year": year, "weekData": week_data}


def get_balance_data(session, current_user, start_date, end_date, user_id: int | None = None):
    if current_user.is_superuser and user_id == current_user.id:
        # Superuser wants to see all data
        cash_in_hand = session.query(func.sum(Balances.cash_in_hand)).scalar() or Decimal(0.00)
        cash_in_bank = session.query(func.sum(Balances.cash_in_bank)).scalar() or Decimal(0.00)

        # Use date to filter based on date range
        inflow_statement = (
            select(func.sum(CommandFunds.amount).label("user_amount"))
            .where(CommandFunds.is_deleted == expression.false(), CommandFunds.date >= start_date,
                   CommandFunds.date <= end_date)
        )
        outflow_statement = (
            select(func.sum(Expenses.cost).label("user_amount"))
            .where(Expenses.is_deleted == expression.false(), Expenses.expense_date >= start_date,
                   Expenses.expense_date <= end_date)
        )
        invest_statement = (
            select(func.sum(Investments.amount).label("user_amount"))
            .where(Investments.is_deleted == expression.false(), Investments.date >= start_date,
                   Investments.date <= end_date)
        )
        liability_statement = (
            select(func.sum(Liabilities.remaining_balance).label("user_amount"))
            .where(Liabilities.is_deleted == expression.false(), Liabilities.date >= start_date,
                   Liabilities.date <= end_date)
        )
    else:
        # Either regular user or superuser viewing specific user data
        query_user_id = user_id if user_id else current_user.id

        user_balance = session.query(Balances).filter(Balances.user_id == query_user_id).first()
        if user_balance is None:
            cash_in_hand = Decimal(0.00)
            cash_in_bank = Decimal(0.00)
        else:
            cash_in_hand = user_balance.cash_in_hand or Decimal(0.00)
            cash_in_bank = user_balance.cash_in_bank or Decimal(0.00)

        # Use date to filter based on date range
        inflow_statement = (
            select(func.sum(CommandFunds.amount).label("user_amount"))
            .where(
                CommandFunds.user_id == query_user_id,
                CommandFunds.is_deleted == expression.false(),
                CommandFunds.date >= start_date,
                CommandFunds.date <= end_date
            )
        )
        outflow_statement = (
            select(func.sum(Expenses.cost).label("user_amount"))
            .where(
                Expenses.user_id == query_user_id,
                Expenses.is_deleted == expression.false(),
                Expenses.expense_date >= start_date,
                Expenses.expense_date <= end_date
            )
        )
        invest_statement = (
            select(func.sum(Investments.amount).label("user_amount"))
            .where(
                Investments.user_id == query_user_id,
                Investments.is_deleted == expression.false(),
                Investments.date >= start_date,
                Investments.date <= end_date
            )
        )
        liability_statement = (
            select(func.sum(Liabilities.remaining_balance).label("user_amount"))
            .where(
                Liabilities.user_id == query_user_id,
                Liabilities.is_deleted == expression.false(),
                Liabilities.date >= start_date,
                Liabilities.date <= end_date
            )
        )

    inflow = session.exec(inflow_statement).one() or Decimal(0.00)
    outflow = session.exec(outflow_statement).one() or Decimal(0.00)
    investment = session.exec(invest_statement).one() or Decimal(0.00)
    liability = session.exec(liability_statement).one() or Decimal(0.00)

    return {
        "cash_in_hand": cash_in_hand,
        "cash_in_bank": cash_in_bank,
        "balance": cash_in_hand + cash_in_bank,
        "inflow": inflow,
        "outflow": outflow,
        "investment": investment,
        "liability": liability,
    }


@router.get("/over-view/{user_id}")
def financial_overview(
        session: SessionDep, current_user: CurrentUser, user_id: int | None
) -> Any:
    """
    Retrieve items.
    """
    if current_user.is_superuser and current_user.id == user_id:
        cash_in_hand = session.query(func.sum(Balances.cash_in_hand)).scalar() or Decimal(0.00)
        cash_in_bank = session.query(func.sum(Balances.cash_in_bank)).scalar() or Decimal(0.00)
        inflow_statement = (
            select(func.sum(CommandFunds.amount).label("user_amount"))
            .where(CommandFunds.is_deleted == expression.false())
        )
        outflow_statement = (
            select(func.sum(Expenses.cost).label("user_amount"))
            .where(Expenses.is_deleted == expression.false())
        )
        invest_statement = (
            select(func.sum(Investments.amount).label("user_amount"))
            .where(Investments.is_deleted == expression.false())
        )
        liability_statement = (
            select(func.sum(Liabilities.remaining_balance).label("user_amount"))
            .where(Liabilities.is_deleted == expression.false())
        )
        inflow = session.exec(inflow_statement).one()
        outflow = session.exec(outflow_statement).one()
        investment = session.exec(invest_statement).one()
        liability = session.exec(liability_statement).one()
    else:
        if user_id:
            query_user_id = user_id
        else:
            query_user_id = current_user.id

        user_balance = session.query(Balances).filter(Balances.user_id == query_user_id).first()
        if user_balance is None:
            # Handle the case where the balance does not exist
            cash_in_hand = 0  # Default value
            cash_in_bank = 0  # Default value
        else:
            cash_in_hand = user_balance.cash_in_hand or Decimal(0.00)
            cash_in_bank = user_balance.cash_in_bank or Decimal(0.00)
        inflow_statement = (
            select(func.sum(CommandFunds.amount).label("user_amount"))
            .where(CommandFunds.user_id == query_user_id, CommandFunds.is_deleted == expression.false())
        )
        outflow_statement = (
            select(func.sum(Expenses.cost).label("user_amount"))
            .where(Expenses.user_id == query_user_id, Expenses.is_deleted == expression.false())
        )
        invest_statement = (
            select(func.sum(Investments.amount).label("user_amount"))
            .where(Investments.user_id == query_user_id, Investments.is_deleted == expression.false())
        )
        liability_statement = (
            select(func.sum(Liabilities.remaining_balance).label("user_amount"))
            .where(Liabilities.user_id == query_user_id, Liabilities.is_deleted == expression.false())
        )
        inflow = session.exec(inflow_statement).one()
        outflow = session.exec(outflow_statement).one()
        investment = session.exec(invest_statement).one()
        liability = session.exec(liability_statement).one()

    return {
        "cash_in_hand": cash_in_hand,
        "cash_in_bank": cash_in_bank,
        "balance": cash_in_hand + cash_in_bank,
        "inflow": inflow,
        "outflow": outflow,
        "investment": investment,
        "liability": liability
    }


@router.get("/{year}/{user_id}")
def get_yearly_balance(session: SessionDep, current_user: CurrentUser, year: int, user_id: int):
    return format_yearly_data(session, current_user, year, user_id)


@router.get("/{year}/{month}/{user_id}")
def get_monthly_balance(session: SessionDep, current_user: CurrentUser, year: int, month: str, user_id: int):
    print("----------->: ", year, month, user_id)
    month_index = list(calendar.month_name).index(month)
    start_date, end_date = get_month_range(year, month_index)
    # Fetch monthly balance data
    monthly_balance = get_balance_data(session, current_user, start_date, end_date, user_id)
    return monthly_balance


@router.get("/range/{start_date}/{end_date}/{user_id}")
def get_weekly_balance(
        session: SessionDep, current_user: CurrentUser,
        start_date: str, end_date: str, user_id: int):
    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")
    print(start_date, end_date)
    range_balance = get_balance_data(session, current_user, start_date, end_date, user_id)
    return range_balance
