-- Add investment_link column to financial_goals
ALTER TABLE public.financial_goals 
ADD COLUMN IF NOT EXISTS investment_link TEXT;

-- Create function to notify on goal progress
CREATE OR REPLACE FUNCTION public.notify_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_percentage DECIMAL;
BEGIN
  -- Calculate progress percentage
  progress_percentage := (NEW.current_amount / NULLIF(NEW.target_amount, 0)) * 100;
  
  -- Notify on significant milestones (25%, 50%, 75%, 90%, 100%)
  IF progress_percentage >= 25 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 25 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 25%',
      'Your goal "' || NEW.title || '" is 25% complete! Keep going!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 25)
    );
  ELSIF progress_percentage >= 50 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 50 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 50%',
      'You''re halfway to your goal "' || NEW.title || '"! Great progress!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 50)
    );
  ELSIF progress_percentage >= 75 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 75 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎯 Goal Progress: 75%',
      'Almost there! Your goal "' || NEW.title || '" is 75% complete!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 75)
    );
  ELSIF progress_percentage >= 90 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 90 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🔥 Goal Progress: 90%',
      'So close! Your goal "' || NEW.title || '" is 90% complete!',
      'goal',
      jsonb_build_object('goal_id', NEW.id, 'progress', 90)
    );
  ELSIF progress_percentage >= 100 AND (OLD.current_amount / NULLIF(OLD.target_amount, 0)) * 100 < 100 THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      '🎉 Goal Achieved!',
      'Congratulations! You''ve completed your goal "' || NEW.title || '"!',
      'success',
      jsonb_build_object('goal_id', NEW.id, 'progress', 100)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for goal progress notifications
DROP TRIGGER IF EXISTS goal_progress_notification_trigger ON public.financial_goals;
CREATE TRIGGER goal_progress_notification_trigger
  AFTER UPDATE ON public.financial_goals
  FOR EACH ROW
  WHEN (OLD.current_amount IS DISTINCT FROM NEW.current_amount)
  EXECUTE FUNCTION public.notify_goal_progress();