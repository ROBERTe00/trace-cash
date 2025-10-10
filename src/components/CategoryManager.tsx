import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface SortableCategoryProps {
  category: Category;
  onRemove: (id: string) => void;
}

function SortableCategory({ category, onRemove }: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-background border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Badge
        style={{ backgroundColor: category.color }}
        className="text-white"
      >
        {category.name}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-6 w-6"
        onClick={() => onRemove(category.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const stored = localStorage.getItem('custom_categories');
    if (stored) {
      setCategories(JSON.parse(stored));
    } else {
      // Default categories
      const defaults: Category[] = [
        { id: '1', name: 'Food & Dining', color: '#ef4444' },
        { id: '2', name: 'Transport', color: '#3b82f6' },
        { id: '3', name: 'Entertainment', color: '#8b5cf6' },
        { id: '4', name: 'Shopping', color: '#ec4899' },
        { id: '5', name: 'Bills & Utilities', color: '#f59e0b' },
        { id: '6', name: 'Healthcare', color: '#10b981' },
        { id: '7', name: 'Education', color: '#6366f1' },
        { id: '8', name: 'Other', color: '#6b7280' },
      ];
      setCategories(defaults);
      localStorage.setItem('custom_categories', JSON.stringify(defaults));
    }
  }, []);

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem('custom_categories', JSON.stringify(newCategories));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat.id === active.id);
      const newIndex = categories.findIndex((cat) => cat.id === over.id);
      const newCategories = arrayMove(categories, oldIndex, newIndex);
      saveCategories(newCategories);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.trim(),
      color: newColor,
    };

    saveCategories([...categories, category]);
    setNewCategory('');
    setNewColor('#3b82f6');
    toast.success('Category added successfully');
  };

  const removeCategory = (id: string) => {
    saveCategories(categories.filter((cat) => cat.id !== id));
    toast.success('Category removed');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>
          Customize your expense categories. Drag to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="w-12 h-10 rounded border cursor-pointer"
          />
          <Button onClick={addCategory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {categories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  onRemove={removeCategory}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
