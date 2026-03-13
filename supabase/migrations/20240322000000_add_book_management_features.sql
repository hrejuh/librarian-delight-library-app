-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create book_queue table
CREATE TABLE IF NOT EXISTS book_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'expired', 'fulfilled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    notified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    UNIQUE(book_id, user_id)
);

-- Add book condition tracking to borrowings table
ALTER TABLE borrowings
ADD COLUMN IF NOT EXISTS book_condition_on_borrow TEXT CHECK (book_condition_on_borrow IN ('good', 'fair', 'poor')),
ADD COLUMN IF NOT EXISTS book_condition_on_return TEXT CHECK (book_condition_on_return IN ('good', 'fair', 'poor', 'damaged')),
ADD COLUMN IF NOT EXISTS condition_notes_on_borrow TEXT,
ADD COLUMN IF NOT EXISTS condition_notes_on_return TEXT;

-- Create function to manage book queue
CREATE OR REPLACE FUNCTION manage_book_queue(
    p_book_id UUID,
    p_user_id UUID,
    p_institution_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_queue_id UUID;
    v_position INTEGER;
    v_book_available INTEGER;
    v_queue_count INTEGER;
BEGIN
    -- Check if book exists and get available count
    SELECT available INTO v_book_available
    FROM books
    WHERE id = p_book_id AND institution_id = p_institution_id;

    IF v_book_available IS NULL THEN
        RAISE EXCEPTION 'Book not found or not in this institution';
    END IF;

    -- If book is available, no need to queue
    IF v_book_available > 0 THEN
        RAISE EXCEPTION 'Book is available for immediate borrowing';
    END IF;

    -- Check if user is already in queue
    SELECT id INTO v_queue_id
    FROM book_queue
    WHERE book_id = p_book_id AND user_id = p_user_id;

    IF v_queue_id IS NOT NULL THEN
        RAISE EXCEPTION 'You are already in the queue for this book';
    END IF;

    -- Get current queue count
    SELECT COUNT(*) INTO v_queue_count
    FROM book_queue
    WHERE book_id = p_book_id AND status = 'waiting';

    -- Insert new queue entry
    INSERT INTO book_queue (
        book_id,
        user_id,
        institution_id,
        position,
        expires_at
    ) VALUES (
        p_book_id,
        p_user_id,
        p_institution_id,
        v_queue_count + 1,
        now() + interval '7 days'
    )
    RETURNING id INTO v_queue_id;

    -- Create notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        metadata
    ) VALUES (
        p_user_id,
        'queue_joined',
        'Added to Book Queue',
        'You have been added to the queue for the book. We will notify you when it becomes available.',
        jsonb_build_object('queue_id', v_queue_id, 'book_id', p_book_id)
    );

    RETURN v_queue_id;
END;
$$;

-- Create function to process book queue when a book is returned
CREATE OR REPLACE FUNCTION process_book_queue(
    p_book_id UUID,
    p_institution_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_in_queue RECORD;
BEGIN
    -- Get the next person in queue
    SELECT * INTO v_next_in_queue
    FROM book_queue
    WHERE book_id = p_book_id 
    AND institution_id = p_institution_id
    AND status = 'waiting'
    AND expires_at > now()
    ORDER BY position ASC
    LIMIT 1;

    IF v_next_in_queue IS NOT NULL THEN
        -- Update queue status
        UPDATE book_queue
        SET status = 'notified',
            notified_at = now()
        WHERE id = v_next_in_queue.id;

        -- Create notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            v_next_in_queue.user_id,
            'book_available',
            'Book Available',
            'A book you queued for is now available. You have 24 hours to borrow it.',
            jsonb_build_object('queue_id', v_next_in_queue.id, 'book_id', p_book_id)
        );
    END IF;
END;
$$;

-- Create function to update book condition
CREATE OR REPLACE FUNCTION update_book_condition(
    p_borrowing_id UUID,
    p_condition TEXT,
    p_notes TEXT,
    p_is_return BOOLEAN
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_is_return THEN
        UPDATE borrowings
        SET book_condition_on_return = p_condition,
            condition_notes_on_return = p_notes
        WHERE id = p_borrowing_id;
    ELSE
        UPDATE borrowings
        SET book_condition_on_borrow = p_condition,
            condition_notes_on_borrow = p_notes
        WHERE id = p_borrowing_id;
    END IF;
END;
$$;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_queue ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Book queue policies
CREATE POLICY "Users can view their own queue entries"
    ON book_queue FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can join queue"
    ON book_queue FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Institution staff can view queue"
    ON book_queue FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.institution_id = book_queue.institution_id
            AND profiles.role IN ('admin', 'librarian')
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_book_queue_book_id ON book_queue(book_id);
CREATE INDEX IF NOT EXISTS idx_book_queue_user_id ON book_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_book_queue_status ON book_queue(status);

-- Add trigger to process queue when book is returned
CREATE OR REPLACE FUNCTION trigger_process_book_queue()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
        PERFORM process_book_queue(NEW.book_id, NEW.institution_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_book_return
    AFTER UPDATE ON borrowings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_process_book_queue(); 