use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("BpwVDevvmYxhBAoXmFj9rVHZDsbDEsGxD8S1yKURapBE");

#[program]
pub mod friend_bet_program {
    use super::*;

    pub fn create_bet(
        ctx: Context<CreateBet>,
        bet_id: u64,
        question: String,
        opponent: Pubkey,
        stake_lamports: u64,
        deadline_ts: i64,
    ) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let now = Clock::get()?.unix_timestamp;

        require!(question.len() <= 200, BetError::QuestionTooLong);
        require!(stake_lamports > 0, BetError::InvalidStake);
        require!(deadline_ts > now, BetError::InvalidDeadline);

        bet.bet_id = bet_id;
        bet.creator = ctx.accounts.creator.key();
        bet.opponent = opponent;
        bet.question = question;
        bet.stake_lamports = stake_lamports;
        bet.deadline_ts = deadline_ts;
        bet.creator_deposited = false;
        bet.opponent_deposited = false;
        bet.status = BetStatus::Open;
        bet.winner = None;
        bet.bump = ctx.bumps.bet;

        Ok(())
    }

    pub fn deposit_creator(ctx: Context<DepositCreator>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;

        require_keys_eq!(ctx.accounts.creator.key(), bet.creator, BetError::Unauthorized);
        require!(!bet.creator_deposited, BetError::AlreadyDeposited);
        require!(
            bet.status == BetStatus::Open || bet.status == BetStatus::Pending,
            BetError::InvalidStatus
        );

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.bet.to_account_info(),
            },
        );

        system_program::transfer(cpi_ctx, bet.stake_lamports)?;

        bet.creator_deposited = true;
        update_status(bet);

        Ok(())
    }

    pub fn accept_bet(ctx: Context<AcceptBet>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let now = Clock::get()?.unix_timestamp;

        require_keys_eq!(ctx.accounts.opponent.key(), bet.opponent, BetError::Unauthorized);
        require!(now < bet.deadline_ts, BetError::DeadlinePassed);
        require!(!bet.opponent_deposited, BetError::AlreadyDeposited);
        require!(
            bet.status == BetStatus::Open || bet.status == BetStatus::Pending,
            BetError::InvalidStatus
        );

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.opponent.to_account_info(),
                to: ctx.accounts.bet.to_account_info(),
            },
        );

        system_program::transfer(cpi_ctx, bet.stake_lamports)?;

        bet.opponent_deposited = true;
        update_status(bet);

        Ok(())
    }

    pub fn resolve_bet(ctx: Context<ResolveBet>, creator_wins: bool) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let now = Clock::get()?.unix_timestamp;

        require_keys_eq!(ctx.accounts.creator.key(), bet.creator, BetError::Unauthorized);
        require!(bet.status == BetStatus::Active, BetError::InvalidStatus);
        require!(now >= bet.deadline_ts, BetError::TooEarlyToResolve);

        bet.winner = Some(if creator_wins { bet.creator } else { bet.opponent });
        bet.status = BetStatus::Resolved;

        Ok(())
    }

    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        let bet = &mut ctx.accounts.bet;
        let claimant = ctx.accounts.claimant.key();

        require!(bet.status == BetStatus::Resolved, BetError::InvalidStatus);
        require!(bet.winner == Some(claimant), BetError::Unauthorized);

        let payout = bet
            .stake_lamports
            .checked_mul(2)
            .ok_or(BetError::MathOverflow)?;

        **bet.to_account_info().try_borrow_mut_lamports()? -= payout;
        **ctx.accounts.claimant.to_account_info().try_borrow_mut_lamports()? += payout;

        bet.status = BetStatus::Claimed;

        Ok(())
    }
}

fn update_status(bet: &mut Account<Bet>) {
    if bet.creator_deposited && bet.opponent_deposited {
        bet.status = BetStatus::Active;
    } else if bet.creator_deposited || bet.opponent_deposited {
        bet.status = BetStatus::Pending;
    } else {
        bet.status = BetStatus::Open;
    }
}

#[derive(Accounts)]
#[instruction(bet_id: u64)]
pub struct CreateBet<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Bet::INIT_SPACE,
        seeds = [b"bet", creator.key().as_ref(), &bet_id.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCreator<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptBet<'info> {
    #[account(mut)]
    pub opponent: Signer<'info>,

    #[account(mut)]
    pub bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub bet: Account<'info, Bet>,
}

#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    #[account(mut)]
    pub bet: Account<'info, Bet>,
}

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub bet_id: u64,
    pub creator: Pubkey,
    pub opponent: Pubkey,

    #[max_len(200)]
    pub question: String,

    pub stake_lamports: u64,
    pub deadline_ts: i64,

    pub creator_deposited: bool,
    pub opponent_deposited: bool,

    pub status: BetStatus,
    pub winner: Option<Pubkey>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BetStatus {
    Open,
    Pending,
    Active,
    Resolved,
    Claimed,
}

#[error_code]
pub enum BetError {
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("Invalid stake")]
    InvalidStake,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Already deposited")]
    AlreadyDeposited,
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Deadline already passed")]
    DeadlinePassed,
    #[msg("Too early to resolve")]
    TooEarlyToResolve,
    #[msg("Math overflow")]
    MathOverflow,
}