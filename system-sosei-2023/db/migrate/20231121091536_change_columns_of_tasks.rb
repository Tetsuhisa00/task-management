class ChangeColumnsOfTasks < ActiveRecord::Migration[7.0]
  def change
    rename_column :tasks, :due_date, :deadline
    rename_column :tasks, :tag_id, :ability_id
    add_column :tasks, :work_days, :integer
    add_column :tasks, :work_output, :integer
    rename_column :shapes, :type, :shape_type
  end
end
